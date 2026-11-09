package images

import (
	"bytes"
	"encoding/binary"
	"errors"
	"image"
	"image/color"
	"image/gif"
	"image/jpeg"
	"image/png"
	"testing"
)

var (
	red  = color.RGBA{255, 0, 0, 255}
	blue = color.RGBA{0, 0, 255, 255}
)

// halves is a w x h picture whose left half is red and right half blue.
func halves(w, h int) *image.RGBA {
	m := image.NewRGBA(image.Rect(0, 0, w, h))
	for y := range h {
		for x := range w {
			if x < w/2 {
				m.Set(x, y, red)
			} else {
				m.Set(x, y, blue)
			}
		}
	}
	return m
}

func encodeJPEG(t *testing.T, m image.Image) []byte {
	t.Helper()
	var buf bytes.Buffer
	if err := jpeg.Encode(&buf, m, &jpeg.Options{Quality: 95}); err != nil {
		t.Fatal(err)
	}
	return buf.Bytes()
}

func encodePNG(t *testing.T, m image.Image) []byte {
	t.Helper()
	var buf bytes.Buffer
	if err := png.Encode(&buf, m); err != nil {
		t.Fatal(err)
	}
	return buf.Bytes()
}

// withOrientation inserts an EXIF APP1 segment with the given orientation
// after a JPEG's SOI marker, in the given byte order.
func withOrientation(data []byte, orientation uint16, order binary.ByteOrder) []byte {
	var tiff bytes.Buffer
	if order == binary.LittleEndian {
		tiff.WriteString("II")
	} else {
		tiff.WriteString("MM")
	}
	_ = binary.Write(&tiff, order, uint16(42))
	_ = binary.Write(&tiff, order, uint32(8)) // IFD0 right after the header
	_ = binary.Write(&tiff, order, uint16(2)) // two entries
	// An unrelated tag first (ImageWidth, LONG), so the reader has to skip.
	_ = binary.Write(&tiff, order, []uint16{0x0100, 4})
	_ = binary.Write(&tiff, order, []uint32{1, 640})
	_ = binary.Write(&tiff, order, []uint16{exifOrientationTag, 3})
	_ = binary.Write(&tiff, order, uint32(1))
	_ = binary.Write(&tiff, order, []uint16{orientation, 0})
	_ = binary.Write(&tiff, order, uint32(0)) // no next IFD

	payload := append([]byte("Exif\x00\x00"), tiff.Bytes()...)
	segment := []byte{0xFF, 0xE1, 0, 0}
	binary.BigEndian.PutUint16(segment[2:], uint16(len(payload)+2))
	segment = append(segment, payload...)

	out := append([]byte{}, data[:2]...)
	out = append(out, segment...)
	return append(out, data[2:]...)
}

func near(t *testing.T, m image.Image, x, y int, want color.RGBA) {
	t.Helper()
	r, g, b, _ := m.At(x, y).RGBA()
	got := []int{int(r >> 8), int(g >> 8), int(b >> 8)}
	exp := []int{int(want.R), int(want.G), int(want.B)}
	for i := range got {
		if d := got[i] - exp[i]; d > 40 || d < -40 {
			t.Fatalf("pixel (%d, %d) = %v, want about %v", x, y, got, exp)
		}
	}
}

func decode(t *testing.T, img *Image) image.Image {
	t.Helper()
	m, _, err := image.Decode(bytes.NewReader(img.Data))
	if err != nil {
		t.Fatal(err)
	}
	return m
}

func TestJPEGOrientation(t *testing.T) {
	plain := encodeJPEG(t, halves(8, 8))
	if got := jpegOrientation(plain); got != 1 {
		t.Errorf("no EXIF: got %d, want 1", got)
	}
	for _, order := range []binary.ByteOrder{binary.LittleEndian, binary.BigEndian} {
		for o := uint16(1); o <= 8; o++ {
			if got := jpegOrientation(withOrientation(plain, o, order)); got != int(o) {
				t.Errorf("%v orientation %d: got %d", order, o, got)
			}
		}
	}
	if got := jpegOrientation(withOrientation(plain, 9, binary.BigEndian)); got != 1 {
		t.Errorf("out-of-range orientation: got %d, want 1", got)
	}
	// Truncated metadata must not panic.
	exif := withOrientation(plain, 6, binary.BigEndian)
	for n := range 60 {
		jpegOrientation(exif[:n])
	}
}

func TestProcessRotates(t *testing.T) {
	// 40x20, left half red. Orientation 6 means "turn 90 degrees
	// clockwise to display", so the result is 20x40 with red on top.
	data := withOrientation(encodeJPEG(t, halves(40, 20)), 6, binary.LittleEndian)
	img, err := Process(data, MaxWidth)
	if err != nil {
		t.Fatal(err)
	}
	if img.Ext != "jpg" || img.ContentType != "image/jpeg" {
		t.Fatalf("got %s %s, want a JPEG", img.Ext, img.ContentType)
	}
	m := decode(t, img)
	if b := m.Bounds(); b.Dx() != 20 || b.Dy() != 40 {
		t.Fatalf("size %v, want 20x40", b.Size())
	}
	near(t, m, 10, 5, red)
	near(t, m, 10, 35, blue)

	// Orientation 8 is the other way: blue on top.
	data = withOrientation(encodeJPEG(t, halves(40, 20)), 8, binary.BigEndian)
	img, err = Process(data, MaxWidth)
	if err != nil {
		t.Fatal(err)
	}
	m = decode(t, img)
	near(t, m, 10, 5, blue)
	near(t, m, 10, 35, red)

	// Orientation 3 is upside down: blue on the left.
	data = withOrientation(encodeJPEG(t, halves(40, 20)), 3, binary.BigEndian)
	img, err = Process(data, MaxWidth)
	if err != nil {
		t.Fatal(err)
	}
	m = decode(t, img)
	near(t, m, 5, 10, blue)
	near(t, m, 35, 10, red)
}

func TestProcessScalesDown(t *testing.T) {
	img, err := Process(encodePNG(t, halves(4000, 100)), MaxWidth)
	if err != nil {
		t.Fatal(err)
	}
	m := decode(t, img)
	if b := m.Bounds(); b.Dx() != 1920 || b.Dy() != 48 {
		t.Fatalf("size %v, want 1920x48", b.Size())
	}
	// An opaque PNG becomes a JPEG.
	if img.Ext != "jpg" {
		t.Errorf("ext %q, want jpg", img.Ext)
	}

	// The width limit applies after turning it upright: 100x4000 shown
	// sideways is 4000 wide.
	data := withOrientation(encodeJPEG(t, halves(100, 4000)), 6, binary.BigEndian)
	img, err = Process(data, MaxWidth)
	if err != nil {
		t.Fatal(err)
	}
	if b := decode(t, img).Bounds(); b.Dx() != 1920 || b.Dy() != 48 {
		t.Fatalf("rotated size %v, want 1920x48", b.Size())
	}

	// Small pictures aren't enlarged.
	img, err = Process(encodePNG(t, halves(30, 10)), MaxWidth)
	if err != nil {
		t.Fatal(err)
	}
	if b := decode(t, img).Bounds(); b.Dx() != 30 || b.Dy() != 10 {
		t.Fatalf("size %v, want 30x10", b.Size())
	}
}

func TestProcessKeepsTransparency(t *testing.T) {
	m := halves(10, 10)
	m.Set(0, 0, color.RGBA{})
	img, err := Process(encodePNG(t, m), MaxWidth)
	if err != nil {
		t.Fatal(err)
	}
	if img.Ext != "png" || img.ContentType != "image/png" {
		t.Fatalf("got %s %s, want a PNG", img.Ext, img.ContentType)
	}
	if _, _, _, a := decode(t, img).At(0, 0).RGBA(); a != 0 {
		t.Errorf("alpha %d, want 0", a)
	}
}

func TestProcessGIF(t *testing.T) {
	var buf bytes.Buffer
	if err := gif.Encode(&buf, halves(10, 10), nil); err != nil {
		t.Fatal(err)
	}
	img, err := Process(buf.Bytes(), MaxWidth)
	if err != nil {
		t.Fatal(err)
	}
	near(t, decode(t, img), 2, 5, red)
}

func TestProcessRejects(t *testing.T) {
	var huge bytes.Buffer
	if err := gif.Encode(&huge, halves(2, 2), nil); err != nil {
		t.Fatal(err)
	}
	hugeGIF := huge.Bytes()
	// The logical screen size in the header: 10000x10000.
	binary.LittleEndian.PutUint16(hugeGIF[6:], 10000)
	binary.LittleEndian.PutUint16(hugeGIF[8:], 10000)

	jpegData := encodeJPEG(t, halves(8, 8))
	cases := map[string][]byte{
		"html": []byte("<!DOCTYPE html><html><script>alert(1)</script></html>"),
		"svg": []byte(
			`<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>`,
		),
		"pdf":       []byte("%PDF-1.4\n"),
		"empty":     {},
		"truncated": jpegData[:len(jpegData)/2],
		"too large": hugeGIF,
	}
	for name, data := range cases {
		if _, err := Process(data, MaxWidth); !errors.Is(err, ErrInvalidImage) {
			t.Errorf("%s: got %v, want ErrInvalidImage", name, err)
		}
	}
}

func TestReadLimit(t *testing.T) {
	data := encodePNG(t, halves(10, 10))
	if _, err := Read(bytes.NewReader(data), int64(len(data)), MaxWidth); err != nil {
		t.Errorf("at the limit: %v", err)
	}
	if _, err := Read(bytes.NewReader(data), int64(len(data)-1), MaxWidth); !errors.Is(
		err,
		ErrInvalidImage,
	) {
		t.Errorf("over the limit: got %v, want ErrInvalidImage", err)
	}
}

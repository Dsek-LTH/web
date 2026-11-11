package images

import (
	"bytes"
	"context"
	"encoding/binary"
	"errors"
	"hash/crc32"
	"image"
	"image/color"
	"image/gif"
	"image/jpeg"
	"image/png"
	"runtime"
	"testing"
	"time"
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
	img, err := Process(context.Background(), data, MaxWidth)
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
	img, err = Process(context.Background(), data, MaxWidth)
	if err != nil {
		t.Fatal(err)
	}
	m = decode(t, img)
	near(t, m, 10, 5, blue)
	near(t, m, 10, 35, red)

	// Orientation 3 is upside down: blue on the left.
	data = withOrientation(encodeJPEG(t, halves(40, 20)), 3, binary.BigEndian)
	img, err = Process(context.Background(), data, MaxWidth)
	if err != nil {
		t.Fatal(err)
	}
	m = decode(t, img)
	near(t, m, 5, 10, blue)
	near(t, m, 35, 10, red)
}

func TestProcessScalesDown(t *testing.T) {
	img, err := Process(context.Background(), encodePNG(t, halves(4000, 100)), MaxWidth)
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
	img, err = Process(context.Background(), data, MaxWidth)
	if err != nil {
		t.Fatal(err)
	}
	if b := decode(t, img).Bounds(); b.Dx() != 1920 || b.Dy() != 48 {
		t.Fatalf("rotated size %v, want 1920x48", b.Size())
	}

	// Small pictures aren't enlarged.
	img, err = Process(context.Background(), encodePNG(t, halves(30, 10)), MaxWidth)
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
	img, err := Process(context.Background(), encodePNG(t, m), MaxWidth)
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
	img, err := Process(context.Background(), buf.Bytes(), MaxWidth)
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
		if _, err := Process(
			context.Background(),
			data,
			MaxWidth,
		); !errors.Is(
			err,
			ErrInvalidImage,
		) {
			t.Errorf("%s: got %v, want ErrInvalidImage", name, err)
		}
	}
}

func TestReadLimit(t *testing.T) {
	data := encodePNG(t, halves(10, 10))
	if _, err := Read(
		context.Background(),
		bytes.NewReader(data),
		int64(len(data)),
		MaxWidth,
	); err != nil {
		t.Errorf("at the limit: %v", err)
	}
	if _, err := Read(
		context.Background(),
		bytes.NewReader(data),
		int64(len(data)-1),
		MaxWidth,
	); !errors.Is(
		err,
		ErrInvalidImage,
	) {
		t.Errorf("over the limit: got %v, want ErrInvalidImage", err)
	}
}

func TestDecodedSizeLimit(t *testing.T) {
	// A 16-bit PNG takes 8 bytes a pixel decoded: 1000x30000 is under
	// MaxPixels but over maxDecodedBytes. Only the header is read, so a
	// 1x1 picture with a patched IHDR is enough.
	data := encodePNG(t, image.NewRGBA64(image.Rect(0, 0, 1, 1)))
	binary.BigEndian.PutUint32(data[16:], 1000)
	binary.BigEndian.PutUint32(data[20:], 30000)
	binary.BigEndian.PutUint32(data[29:], crc32.ChecksumIEEE(data[12:29]))
	cfg, err := png.DecodeConfig(bytes.NewReader(data))
	if err != nil || bytesPerPixel(cfg.ColorModel) != 8 {
		t.Fatalf("patched header: %v %v", cfg.ColorModel, err)
	}
	if _, err := Process(context.Background(), data, MaxWidth); !errors.Is(err, ErrInvalidImage) {
		t.Errorf("got %v, want ErrInvalidImage", err)
	}
	if got := bytesPerPixel(color.Palette{red, blue}); got != 1 {
		t.Errorf("palette: %d bytes per pixel, want 1", got)
	}
}

func TestWaitsForASlot(t *testing.T) {
	data := encodePNG(t, halves(10, 10))
	// Take every slot, so Process has to wait.
	for range cap(slots) {
		slots <- struct{}{}
	}
	ctx, cancel := context.WithTimeout(context.Background(), 20*time.Millisecond)
	defer cancel()
	_, err := Process(ctx, data, MaxWidth)
	if !errors.Is(err, context.DeadlineExceeded) {
		t.Errorf("all slots taken: got %v, want the context's error", err)
	}
	_, err = Read(ctx, bytes.NewReader(data), int64(len(data)), MaxWidth)
	if !errors.Is(err, context.DeadlineExceeded) {
		t.Errorf("Read, all slots taken: got %v, want the context's error", err)
	}
	for range cap(slots) {
		<-slots
	}
	if _, err := Process(context.Background(), data, MaxWidth); err != nil {
		t.Errorf("slots free: %v", err)
	}
}

func TestExtremeShapes(t *testing.T) {
	encodeGray := func(w, h int) []byte {
		var buf bytes.Buffer
		enc := png.Encoder{CompressionLevel: png.BestSpeed}
		if err := enc.Encode(&buf, image.NewGray(image.Rect(0, 0, w, h))); err != nil {
			t.Fatal(err)
		}
		return buf.Bytes()
	}
	allocated := func(f func()) uint64 {
		runtime.GC()
		var before, after runtime.MemStats
		runtime.ReadMemStats(&before)
		f()
		runtime.ReadMemStats(&after)
		return after.TotalAlloc - before.TotalAlloc
	}

	// 4 MP but 40000 times as wide as tall: once asked for a band of
	// gigabytes. Refused from the header.
	wide := encodeGray(400_000, 10)
	var err error
	n := allocated(func() { _, err = Process(context.Background(), wide, MaxWidth) })
	if !errors.Is(err, ErrInvalidImage) {
		t.Errorf("400000x10: got %v, want ErrInvalidImage", err)
	}
	if n > 20_000_000 {
		t.Errorf("400000x10: allocated %d bytes", n)
	}
	for _, size := range [][2]int{{10, 400_000}, {MaxSide + 1, MaxSide/maxAspect + 1}} {
		if _, err := Process(
			context.Background(),
			encodeGray(size[0], size[1]),
			MaxWidth,
		); !errors.Is(
			err,
			ErrInvalidImage,
		) {
			t.Errorf("%dx%d: got %v, want ErrInvalidImage", size[0], size[1], err)
		}
	}

	// The widest accepted shape scales with little more than its own
	// decoded size (9 MB).
	edge := encodeGray(MaxSide, MaxSide/maxAspect)
	var img *Image
	n = allocated(func() { img, err = Process(context.Background(), edge, MaxWidth) })
	if err != nil {
		t.Fatal(err)
	}
	if b := decode(t, img).Bounds(); b.Dx() != MaxWidth || b.Dy() != 19 {
		t.Errorf("size %v, want 1920x19", b.Size())
	}
	if n > 60_000_000 {
		t.Errorf("%dx%d: allocated %d bytes", MaxSide, MaxSide/maxAspect, n)
	}
}

func TestJPEGProgressive(t *testing.T) {
	data := encodeJPEG(t, halves(8, 8))
	if jpegProgressive(data) {
		t.Fatal("baseline JPEG reported progressive")
	}
	sof := bytes.Index(data, []byte{0xFF, 0xC0})
	if sof < 0 {
		t.Fatal("no SOF0")
	}
	data[sof+1] = 0xC2
	if !jpegProgressive(data) {
		t.Error("SOF2 JPEG not reported progressive")
	}
	for n := range 40 {
		jpegProgressive(data[:n])
	}
}

// gradient is a w x h RGBA image at bounds starting at (x0, y0) whose red
// is the column and green ten times the row, both relative to the bounds.
func gradient(x0, y0, w, h int) *image.RGBA {
	m := image.NewRGBA(image.Rect(x0, y0, x0+w, y0+h))
	for y := range h {
		for x := range w {
			m.SetRGBA(x0+x, y0+y, color.RGBA{uint8(x), uint8(10 * y), 0, 255})
		}
	}
	return m
}

func TestBoxReduce(t *testing.T) {
	// 7x5 at (5, 7) in blocks of 3: columns {0,1,2} {3,4,5} {6} and rows
	// {0,1,2} {3,4} - the partial blocks average what they have.
	out := boxReduce(gradient(5, 7, 7, 5), 3)
	if out.Rect != image.Rect(0, 0, 3, 2) {
		t.Fatalf("bounds %v, want 3x2 at 0,0", out.Rect)
	}
	wantR := []uint8{1, 4, 6}
	wantG := []uint8{10, 35}
	for oy, g := range wantG {
		for ox, r := range wantR {
			if got := out.RGBAAt(ox, oy); got != (color.RGBA{r, g, 0, 255}) {
				t.Errorf("(%d, %d) = %v, want %v", ox, oy, got, color.RGBA{r, g, 0, 255})
			}
		}
	}

	// A factor far larger than the height must not size the band by the
	// factor: that asked for terabytes here (a fatal out-of-memory).
	var before, after runtime.MemStats
	runtime.GC()
	runtime.ReadMemStats(&before)
	out = boxReduce(image.NewGray(image.Rect(0, 0, 1_000_000, 1)), 500_000)
	runtime.ReadMemStats(&after)
	if out.Rect != image.Rect(0, 0, 2, 1) {
		t.Fatalf("bounds %v, want 2x1", out.Rect)
	}
	if n := after.TotalAlloc - before.TotalAlloc; n > 20_000_000 {
		t.Errorf("allocated %d bytes for a 1000000x1 picture", n)
	}

	// Fewer rows than the factor: one short band.
	out = boxReduce(gradient(0, 0, 9, 1), 4)
	if out.Rect != image.Rect(0, 0, 3, 1) {
		t.Fatalf("bounds %v, want 3x1", out.Rect)
	}
	if got := out.RGBAAt(2, 0); got != (color.RGBA{8, 0, 0, 255}) {
		t.Errorf("last column %v, want red 8", got)
	}
}

func TestScaleOffsetBounds(t *testing.T) {
	// A GIF frame can start anywhere on its canvas.
	pal := color.Palette{red, blue}
	m := image.NewPaletted(image.Rect(5, 7, 5+4000, 7+100), pal)
	for y := m.Rect.Min.Y; y < m.Rect.Max.Y; y++ {
		for x := m.Rect.Min.X + 2000; x < m.Rect.Max.X; x++ {
			m.SetColorIndex(x, y, 1)
		}
	}
	out := scale(m, MaxWidth, false)
	if out.Rect != image.Rect(0, 0, 1920, 48) {
		t.Fatalf("bounds %v, want 1920x48", out.Rect)
	}
	near(t, out, 10, 24, red)
	near(t, out, 1910, 24, blue)
	near(t, out, 900, 0, red)
	near(t, out, 1000, 47, blue)

	var buf bytes.Buffer
	if err := gif.Encode(&buf, m, nil); err != nil {
		t.Fatal(err)
	}
	img, err := Process(context.Background(), buf.Bytes(), MaxWidth)
	if err != nil {
		t.Fatal(err)
	}
	near(t, decode(t, img), 10, 24, red)

	// Turning a picture at non-zero bounds.
	turned := orient(gradient(5, 7, 4, 2), 6)
	if turned.Rect != image.Rect(0, 0, 2, 4) {
		t.Fatalf("turned bounds %v, want 2x4", turned.Rect)
	}
	// The source's top-left ends up top-right.
	if got := turned.RGBAAt(1, 0); got != (color.RGBA{0, 0, 0, 255}) {
		t.Errorf("top-right %v, want the source's top-left", got)
	}
	if got := turned.RGBAAt(0, 3); got != (color.RGBA{3, 10, 0, 255}) {
		t.Errorf("bottom-left %v, want the source's bottom-right", got)
	}
}

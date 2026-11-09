// Package images turns uploaded pictures into what the site stores: it
// accepts only JPEG, PNG, WebP and GIF (by content, not by file name),
// applies the EXIF orientation, scales down to a maximum width and
// re-encodes, which also strips metadata such as GPS positions. It
// replaces the old app's sharp `.rotate().resize().webp()`.
//
// There is no pure-Go WebP encoder, so the result is a JPEG, or a PNG when
// the picture has transparency. GIFs keep only their first frame, as with
// sharp.
package images

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"image"
	"image/color"
	"image/gif"
	"image/jpeg"
	"image/png"
	"io"
	"net/http"

	"golang.org/x/image/draw"
	"golang.org/x/image/webp"
)

// MaxWidth is the width uploads are scaled down to, like the old app's
// resize({ width: 1920 }).
const MaxWidth = 1920

// MaxPixels is the largest picture decoded (width times height): 40
// megapixels is more than phone cameras take by default.
const MaxPixels = 40_000_000

// maxDecodedBytes caps the memory a decoded picture may take, which
// depends on its colour model as well as its size: a 16-bit PNG takes
// twice the memory of an 8-bit one.
const maxDecodedBytes = 200_000_000

// slots bounds how many pictures are decoded at once across every caller
// (article images, album uploads, concurrent requests), since a decoded
// picture can take up to maxDecodedBytes.
var slots = make(chan struct{}, 2)

// jpegQuality is the quality the result is encoded with when it's a JPEG.
const jpegQuality = 85

// ErrInvalidImage is wrapped into every error caused by the upload itself
// (not a supported image, unreadable, too large) rather than the server.
var ErrInvalidImage = errors.New("invalid image")

// Image is a processed picture.
type Image struct {
	Data []byte
	// Ext is the file extension matching Data, without a dot: "jpg" or
	// "png".
	Ext         string
	ContentType string
}

type format struct {
	decode       func(io.Reader) (image.Image, error)
	decodeConfig func(io.Reader) (image.Config, error)
}

// formats are the accepted types, keyed by http.DetectContentType's answer.
var formats = map[string]format{
	"image/jpeg": {jpeg.Decode, jpeg.DecodeConfig},
	"image/png":  {png.Decode, png.DecodeConfig},
	"image/gif":  {gif.Decode, gif.DecodeConfig},
	"image/webp": {webp.Decode, webp.DecodeConfig},
}

// Read reads at most maxBytes from r and processes it like Process. The
// file is only read once a decoding slot is free, so callers waiting for
// one don't hold their files in memory.
func Read(ctx context.Context, r io.Reader, maxBytes int64, maxWidth int) (*Image, error) {
	release, err := acquire(ctx)
	if err != nil {
		return nil, err
	}
	defer release()
	data, err := io.ReadAll(io.LimitReader(r, maxBytes+1))
	if err != nil {
		return nil, fmt.Errorf("read image: %w", err)
	}
	if int64(len(data)) > maxBytes {
		return nil, fmt.Errorf(
			"%w: the file is larger than %d MB",
			ErrInvalidImage,
			maxBytes/1_000_000,
		)
	}
	return process(data, maxWidth)
}

// Process checks that data is a JPEG, PNG, WebP or GIF image, turns it
// upright, scales it down to at most maxWidth pixels wide and re-encodes
// it. It waits for a free decoding slot (see slots), or for ctx to end.
func Process(ctx context.Context, data []byte, maxWidth int) (*Image, error) {
	release, err := acquire(ctx)
	if err != nil {
		return nil, err
	}
	defer release()
	return process(data, maxWidth)
}

// acquire waits for a decoding slot; release gives it back.
func acquire(ctx context.Context) (release func(), err error) {
	select {
	case slots <- struct{}{}:
		return func() { <-slots }, nil
	case <-ctx.Done():
		return nil, fmt.Errorf("process image: %w", ctx.Err())
	}
}

func process(data []byte, maxWidth int) (*Image, error) {
	contentType := http.DetectContentType(data)
	f, ok := formats[contentType]
	if !ok {
		return nil, fmt.Errorf(
			"%w: only JPEG, PNG, WebP and GIF images are allowed",
			ErrInvalidImage,
		)
	}
	cfg, err := f.decodeConfig(bytes.NewReader(data))
	if err != nil {
		return nil, fmt.Errorf("%w: could not read the image: %v", ErrInvalidImage, err)
	}
	pixels := int64(cfg.Width) * int64(cfg.Height)
	if cfg.Width <= 0 || cfg.Height <= 0 || pixels > MaxPixels ||
		pixels*bytesPerPixel(cfg.ColorModel) > maxDecodedBytes {
		return nil, fmt.Errorf(
			"%w: the image can be at most %d megapixels (fewer for 16-bit images)",
			ErrInvalidImage,
			MaxPixels/1_000_000,
		)
	}

	src, err := f.decode(bytes.NewReader(data))
	if err != nil {
		return nil, fmt.Errorf("%w: could not read the image: %v", ErrInvalidImage, err)
	}
	orientation := 1
	if contentType == "image/jpeg" {
		orientation = jpegOrientation(data)
	}
	// Scale first, so turning it upright works on the small picture. When
	// the orientation swaps the axes, the source's height becomes the
	// result's width. A picture that needs neither is encoded as decoded,
	// without a copy.
	img := src
	if scaled := scale(src, maxWidth, orientation >= 5); scaled != nil {
		img = scaled
	}
	if orientation >= 2 && orientation <= 8 {
		img = orient(img, orientation)
	}

	var buf bytes.Buffer
	if o, ok := img.(interface{ Opaque() bool }); ok && o.Opaque() {
		if err := jpeg.Encode(&buf, img, &jpeg.Options{Quality: jpegQuality}); err != nil {
			return nil, fmt.Errorf("encode jpeg: %w", err)
		}
		return &Image{Data: buf.Bytes(), Ext: "jpg", ContentType: "image/jpeg"}, nil
	}
	if err := png.Encode(&buf, img); err != nil {
		return nil, fmt.Errorf("encode png: %w", err)
	}
	return &Image{Data: buf.Bytes(), Ext: "png", ContentType: "image/png"}, nil
}

// bytesPerPixel is how much memory a decoded picture of model takes per
// pixel, at most.
func bytesPerPixel(model color.Model) int64 {
	// A palette is a slice, which == can't compare.
	if _, ok := model.(color.Palette); ok {
		return 1
	}
	switch model {
	case color.GrayModel, color.AlphaModel:
		return 1
	case color.Gray16Model:
		return 2
	case color.YCbCrModel:
		return 3
	case color.RGBA64Model, color.NRGBA64Model:
		return 8
	default:
		return 4
	}
}

// scale draws src into a new RGBA image at most maxWidth wide (after
// orientation, hence swapped), keeping the aspect ratio. It returns nil
// when src is narrow enough already: pictures are never enlarged.
//
// x/image/draw's kernel scalers (CatmullRom, BiLinear) allocate 32 bytes
// for every destination column times source row - hundreds of MB for a
// large photo. Instead, src is first averaged down by a whole factor to
// less than twice the target width, a band of rows at a time, and the rest
// is bilinear, which needs no extra memory.
func scale(src image.Image, maxWidth int, swapped bool) *image.RGBA {
	sb := src.Bounds()
	w, h := sb.Dx(), sb.Dy()
	finalWidth := w
	if swapped {
		finalWidth = h
	}
	if finalWidth <= maxWidth {
		return nil
	}
	ratio := float64(maxWidth) / float64(finalWidth)
	dw := max(1, int(float64(w)*ratio+0.5))
	dh := max(1, int(float64(h)*ratio+0.5))
	if k := finalWidth / maxWidth; k >= 2 {
		src = boxReduce(src, k)
		sb = src.Bounds()
	}
	dst := image.NewRGBA(image.Rect(0, 0, dw, dh))
	draw.ApproxBiLinear.Scale(dst, dst.Bounds(), src, sb, draw.Src, nil)
	return dst
}

// boxReduce averages every k x k block of src into one pixel (partial
// blocks at the right and bottom edges average what they have). Rows are
// converted to RGBA k at a time, so only one band is held besides the
// result.
func boxReduce(src image.Image, k int) *image.RGBA {
	sb := src.Bounds()
	w, h := sb.Dx(), sb.Dy()
	out := image.NewRGBA(image.Rect(0, 0, (w+k-1)/k, (h+k-1)/k))
	band := image.NewRGBA(image.Rect(0, 0, w, k))
	sums := make([][4]uint32, out.Rect.Dx())
	for oy := range out.Rect.Dy() {
		rows := min(k, h-oy*k)
		draw.Draw(band, band.Bounds(), src, image.Pt(sb.Min.X, sb.Min.Y+oy*k), draw.Src)
		clear(sums)
		for y := range rows {
			row := band.Pix[y*band.Stride : y*band.Stride+w*4]
			for x := range w {
				p := row[x*4 : x*4+4]
				s := &sums[x/k]
				s[0] += uint32(p[0])
				s[1] += uint32(p[1])
				s[2] += uint32(p[2])
				s[3] += uint32(p[3])
			}
		}
		for ox, s := range sums {
			n := uint32(min(k, w-ox*k) * rows)
			d := oy*out.Stride + ox*4
			for c := range 4 {
				out.Pix[d+c] = uint8((s[c] + n/2) / n)
			}
		}
	}
	return out
}

// orient applies an EXIF orientation (2-8) to m, into a new RGBA image.
// RGBA (a scaled picture) and YCbCr (a JPEG as decoded) are read directly;
// anything else is converted to RGBA first.
func orient(m image.Image, orientation int) *image.RGBA {
	var pixel func(x, y int) [4]byte
	switch src := m.(type) {
	case *image.RGBA:
		pixel = func(x, y int) [4]byte {
			i := src.PixOffset(x, y)
			return [4]byte(src.Pix[i : i+4])
		}
	case *image.YCbCr:
		pixel = func(x, y int) [4]byte {
			yi, ci := src.YOffset(x, y), src.COffset(x, y)
			r, g, b := color.YCbCrToRGB(src.Y[yi], src.Cb[ci], src.Cr[ci])
			return [4]byte{r, g, b, 0xff}
		}
	default:
		rgba := image.NewRGBA(m.Bounds())
		draw.Draw(rgba, rgba.Bounds(), m, m.Bounds().Min, draw.Src)
		return orient(rgba, orientation)
	}

	b := m.Bounds()
	w, h := b.Dx(), b.Dy()
	dw, dh := w, h
	if orientation >= 5 {
		dw, dh = h, w
	}
	dst := image.NewRGBA(image.Rect(0, 0, dw, dh))
	for sy := range h {
		for sx := range w {
			var dx, dy int
			switch orientation {
			case 2: // mirrored horizontally
				dx, dy = w-1-sx, sy
			case 3: // rotated 180
				dx, dy = w-1-sx, h-1-sy
			case 4: // mirrored vertically
				dx, dy = sx, h-1-sy
			case 5: // transposed
				dx, dy = sy, sx
			case 6: // needs a 90 degree clockwise turn
				dx, dy = h-1-sy, sx
			case 7: // transversed
				dx, dy = h-1-sy, w-1-sx
			case 8: // needs a 90 degree counterclockwise turn
				dx, dy = sy, w-1-sx
			}
			p := pixel(b.Min.X+sx, b.Min.Y+sy)
			d := dy*dst.Stride + dx*4
			copy(dst.Pix[d:d+4], p[:])
		}
	}
	return dst
}

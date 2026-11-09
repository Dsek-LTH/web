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
	"errors"
	"fmt"
	"image"
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

// MaxPixels is the largest picture decoded (width times height), so an
// upload can't make the server allocate gigabytes: 50 megapixels is more
// than any phone camera takes.
const MaxPixels = 50_000_000

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

// Read reads at most maxBytes from r and processes it with Process.
func Read(r io.Reader, maxBytes int64, maxWidth int) (*Image, error) {
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
	return Process(data, maxWidth)
}

// Process checks that data is a JPEG, PNG, WebP or GIF image, turns it
// upright, scales it down to at most maxWidth pixels wide and re-encodes
// it.
func Process(data []byte, maxWidth int) (*Image, error) {
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
	if cfg.Width <= 0 || cfg.Height <= 0 ||
		int64(cfg.Width)*int64(cfg.Height) > MaxPixels {
		return nil, fmt.Errorf(
			"%w: the image can be at most %d megapixels",
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
	// result's width.
	img := scale(src, maxWidth, orientation >= 5)
	img = orient(img, orientation)

	var buf bytes.Buffer
	if img.Opaque() {
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

// scale draws src into a new RGBA image at most maxWidth wide (after
// orientation, hence swapped), keeping the aspect ratio and never
// enlarging.
func scale(src image.Image, maxWidth int, swapped bool) *image.RGBA {
	sb := src.Bounds()
	w, h := sb.Dx(), sb.Dy()
	finalWidth := w
	if swapped {
		finalWidth = h
	}
	if finalWidth <= maxWidth {
		dst := image.NewRGBA(image.Rect(0, 0, w, h))
		draw.Draw(dst, dst.Bounds(), src, sb.Min, draw.Src)
		return dst
	}
	ratio := float64(maxWidth) / float64(finalWidth)
	dw := max(1, int(float64(w)*ratio+0.5))
	dh := max(1, int(float64(h)*ratio+0.5))
	dst := image.NewRGBA(image.Rect(0, 0, dw, dh))
	draw.CatmullRom.Scale(dst, dst.Bounds(), src, sb, draw.Src, nil)
	return dst
}

// orient applies an EXIF orientation (1-8) to m, which starts at (0, 0).
func orient(m *image.RGBA, orientation int) *image.RGBA {
	if orientation < 2 || orientation > 8 {
		return m
	}
	w, h := m.Rect.Dx(), m.Rect.Dy()
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
			s := sy*m.Stride + sx*4
			d := dy*dst.Stride + dx*4
			copy(dst.Pix[d:d+4], m.Pix[s:s+4])
		}
	}
	return dst
}

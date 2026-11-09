package images

import "encoding/binary"

// exifOrientationTag is the TIFF tag holding the EXIF orientation.
const exifOrientationTag = 0x0112

// jpegOrientation returns the EXIF orientation (1-8) of a JPEG, or 1 (as
// stored) when it has none or the metadata can't be read. Only IFD0 is
// read, which is where cameras put the orientation.
func jpegOrientation(b []byte) int {
	if len(b) < 4 || b[0] != 0xFF || b[1] != 0xD8 {
		return 1
	}
	i := 2
	for i+4 <= len(b) {
		if b[i] != 0xFF {
			return 1
		}
		marker := b[i+1]
		switch {
		case marker == 0xFF: // fill byte
			i++
			continue
		case marker == 0xD9 || marker == 0xDA: // end of image, start of scan
			return 1
		case marker == 0x01 || (marker >= 0xD0 && marker <= 0xD7): // no length
			i += 2
			continue
		}
		size := int(binary.BigEndian.Uint16(b[i+2:]))
		if size < 2 || i+2+size > len(b) {
			return 1
		}
		segment := b[i+4 : i+2+size]
		if marker == 0xE1 && len(segment) >= 6 && string(segment[:6]) == "Exif\x00\x00" {
			return tiffOrientation(segment[6:])
		}
		i += 2 + size
	}
	return 1
}

// tiffOrientation reads the orientation tag from IFD0 of the TIFF
// structure inside an EXIF segment.
func tiffOrientation(t []byte) int {
	if len(t) < 8 {
		return 1
	}
	var order binary.ByteOrder
	switch string(t[:2]) {
	case "II":
		order = binary.LittleEndian
	case "MM":
		order = binary.BigEndian
	default:
		return 1
	}
	if order.Uint16(t[2:]) != 42 {
		return 1
	}
	ifd := uint64(order.Uint32(t[4:]))
	if ifd+2 > uint64(len(t)) {
		return 1
	}
	count := uint64(order.Uint16(t[ifd:]))
	for k := range count {
		entry := ifd + 2 + 12*k
		if entry+12 > uint64(len(t)) {
			return 1
		}
		if order.Uint16(t[entry:]) != exifOrientationTag {
			continue
		}
		const typeShort = 3
		if order.Uint16(t[entry+2:]) != typeShort {
			return 1
		}
		orientation := int(order.Uint16(t[entry+8:]))
		if orientation < 1 || orientation > 8 {
			return 1
		}
		return orientation
	}
	return 1
}

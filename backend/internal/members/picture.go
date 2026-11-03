package members

import (
	"bytes"
	"context"
	"errors"
	"fmt"
	"image"
	_ "image/gif"  // registers GIF decoding for image.DecodeConfig
	_ "image/jpeg" // registers JPEG decoding for image.DecodeConfig
	_ "image/png"  // registers PNG decoding for image.DecodeConfig
	"log"
	"strings"

	"github.com/google/uuid"
	"github.com/jackc/pgx/v5"
	"github.com/jackc/pgx/v5/pgtype"
	_ "golang.org/x/image/webp" // registers WebP decoding for image.DecodeConfig

	"github.com/dsek-lth/web/backend/internal/db"
	"github.com/dsek-lth/web/backend/internal/dbutil"
)

// MaxPictureSize matches the old upload form's 8 MB limit.
const MaxPictureSize = 8_000_000

// maxPictureSide is the largest width/height accepted. The browser crops
// and scales pictures to 400x400 before uploading; this only stops
// something unreasonably large from being stored as an avatar.
const maxPictureSide = 2000

func pictureKeyPrefix(studentID string) string {
	return "public/" + studentID + "/profile-picture/"
}

// UploadPicture stores data as the member's profile picture and makes it
// their avatar (members.picture_path), removing the picture it replaces.
// Self or core:member:update, like the rest of the profile.
//
// Fixes the old app, whose upload stored the file but never set
// picture_path, so a new picture was never shown.
func (s *Service) UploadPicture(
	ctx context.Context,
	studentID string,
	data []byte,
) (string, error) {
	if err := s.authorizeSelfOrUpdate(ctx, studentID); err != nil {
		return "", err
	}
	if len(data) == 0 || len(data) > MaxPictureSize {
		return "", invalidf("the picture must be between 1 byte and 8 MB")
	}
	cfg, format, err := image.DecodeConfig(bytes.NewReader(data))
	if err != nil {
		return "", invalidf("not a supported image (JPEG, PNG, GIF or WebP)")
	}
	if cfg.Width > maxPictureSide || cfg.Height > maxPictureSide {
		return "", invalidf(
			"the picture can be at most %dx%d pixels",
			maxPictureSide,
			maxPictureSide,
		)
	}

	previous, err := s.picturePath(ctx, studentID)
	if err != nil {
		return "", err
	}
	key := pictureKeyPrefix(studentID) + uuid.NewString() + "." + format
	url, err := s.storage.Put(ctx, s.membersBucket, key, bytes.NewReader(data), int64(len(data)))
	if err != nil {
		return "", fmt.Errorf("store picture: %w", err)
	}
	if err := s.setPicturePath(ctx, studentID, &url); err != nil {
		return "", err
	}
	s.removeStoredPicture(ctx, studentID, previous)
	return url, nil
}

// RemovePicture clears the member's avatar and deletes the stored picture.
func (s *Service) RemovePicture(ctx context.Context, studentID string) error {
	if err := s.authorizeSelfOrUpdate(ctx, studentID); err != nil {
		return err
	}
	previous, err := s.picturePath(ctx, studentID)
	if err != nil {
		return err
	}
	if err := s.setPicturePath(ctx, studentID, nil); err != nil {
		return err
	}
	s.removeStoredPicture(ctx, studentID, previous)
	return nil
}

func (s *Service) picturePath(ctx context.Context, studentID string) (string, error) {
	path, err := s.queries.GetMemberPicturePath(ctx, pgtype.Text{String: studentID, Valid: true})
	if errors.Is(err, pgx.ErrNoRows) {
		return "", ErrNotFound
	}
	if err != nil {
		return "", fmt.Errorf("get picture path: %w", err)
	}
	return path.String, nil
}

func (s *Service) setPicturePath(ctx context.Context, studentID string, path *string) error {
	n, err := s.queries.SetMemberPicturePath(ctx, db.SetMemberPicturePathParams{
		StudentID:   pgtype.Text{String: studentID, Valid: true},
		PicturePath: dbutil.ToText(path),
	})
	if err != nil {
		return fmt.Errorf("set picture path: %w", err)
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}

// removeStoredPicture deletes a replaced picture, but only one this
// service stored (picture_path can also be an external URL). Best-effort:
// the avatar has already changed, so a leftover file is only logged.
func (s *Service) removeStoredPicture(ctx context.Context, studentID, url string) {
	marker := "/" + s.membersBucket + "/" + pictureKeyPrefix(studentID)
	i := strings.Index(url, marker)
	if i < 0 {
		return
	}
	key := url[i+len("/"+s.membersBucket+"/"):]
	if err := s.storage.Remove(ctx, s.membersBucket, []string{key}); err != nil {
		log.Printf("members: remove old profile picture %s: %v", key, err)
	}
}

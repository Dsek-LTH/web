package main

import (
	"fmt"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"
)

func openDatabaseConnection(db **gorm.DB) error {
	host, user, password, name, port := os.Getenv("POSTGRES_HOST"), os.Getenv("POSTGRES_USER"), os.Getenv("POSTGRES_PASSWORD"), os.Getenv("POSTGRES_DB"), os.Getenv("POSTGRES_PORT")
	dsn := fmt.Sprintf("host=%s user=%s password=%s dbname=%s port=%s sslmode=disable TimeZone=UTC", host, user, password, name, port)

	var err error
	if *db, err = gorm.Open(postgres.Open(dsn), &gorm.Config{}); err != nil {
		return err
	}

	return nil
}

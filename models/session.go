package models

import (
	"time"

	"go.mongodb.org/mongo-driver/bson/primitive"
)

// Session Model
// type Session struct {
// 	ID        primitive.ObjectID `json:"_id" bson:"_id,omitempty"`
// 	SessionID string             `json:"session-id" bson:"session-id"`
// 	Email     string             `json:"email" bson:"email"`
// 	Expires   time.Time          `json:"expires" bson:"expires"`
// }

type Session struct {
	ID        primitive.ObjectID `json:"_id" bson:"_id,omitempty"`
	SessionID string             `json:"session-id" bson:"session-id"`
	Email     string             `json:"email" bson:"email"`
	Expires   time.Time          `json:"expires" bson:"expires"`
}

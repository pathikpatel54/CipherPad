package models

// // User struct
// type User struct {
// 	ID            primitive.ObjectID `json:"-" bson:"_id,omitempty"`
// 	GoogleID      string             `json:"id" bson:"id"`
// 	Email         string             `json:"email" bson:"email"`
// 	VerifiedEmail bool               `json:"verified_email" bson:"verified_email"`
// 	Name          string             `json:"name" bson:"name"`
// 	GivenName     string             `json:"given_name" bson:"given_name"`
// 	FamilyName    string             `json:"family_name" bson:"family_name"`
// 	Picture       string             `json:"picture" bson:"picture"`
// 	Locale        string             `json:"locale" bson:"locale"`
// }

type User struct {
	ID       string `json:"_id,omitempty" bson:"_id,omitempty"`
	Name     string `json:"name" bson:"name"`
	Email    string `json:"email" bson:"email"`
	Password string `json:"password,omitempty" bson:"password"`
}

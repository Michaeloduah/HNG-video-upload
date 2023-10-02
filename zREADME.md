# Database Schema Documentation
Authentication and User Management
User Table
The User table stores user-related information and serves as the central entity for authentication and user management.

## Fields:
user_id (Primary Key): Unique identifier for each user.
username: User's chosen username (optional).
email (Unique Constraint): User's email address, used for login and communication.
password_hash: Securely hashed and salted password.
is_verified: Boolean flag indicating whether the user's email is verified.
created_at: Timestamp indicating when the user account was created.

# Email Verification Tokens Table
The EmailVerificationTokens table manages email verification tokens used during the registration process.

## Fields:
token_id (Primary Key): Unique identifier for each token.
user_id (Foreign Key): Reference to the corresponding user.
token: Unique token generated for email verification.
expiration_date: Timestamp indicating when the token expires.
created_at: Timestamp indicating when the token was created.

# Password Reset Tokens Table
The PasswordResetTokens table handles tokens used for resetting forgotten passwords.

## Fields:
token_id (Primary Key): Unique identifier for each token.
user_id (Foreign Key): Reference to the corresponding user.
token: Unique token generated for password reset.
expiration_date: Timestamp indicating when the token expires.
created_at: Timestamp indicating when the token was created.

# Relationships
The User table is related to the EmailVerificationTokens and PasswordResetTokens tables using foreign keys (user_id).
Email verification tokens and password reset tokens are associated with specific users, ensuring data integrity and security.



# Security Considerations
Passwords are securely hashed and salted using industry-standard cryptographic algorithms (e.g., bcrypt).
Token generation and handling follow secure practices to prevent abuse and unauthorized access.

# Logging and Auditing
Implement logging and auditing mechanisms to record critical events related to authentication, email verification, password resets, and user account changes.



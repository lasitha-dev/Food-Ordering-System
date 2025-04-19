## Service-to-Service Authentication

The Auth Service now supports service-to-service authentication with the following features:

### Service Accounts
- Service accounts represent machine identities for microservices
- Each service has its own client ID and client secret for authentication
- Service accounts are seeded automatically on service startup

### Client Credentials Flow
- Services can obtain tokens by providing their client ID and client secret
- Tokens include service-specific scopes that limit access to resources
- Tokens can be validated and revoked similar to user tokens

### API Endpoints

#### Service Authentication
- `POST /api/service-auth/authenticate` - Obtain a service token
  ```json
  {
    "clientId": "your-client-id",
    "clientSecret": "your-client-secret"
  }
  ```

- `POST /api/service-auth/validate` - Validate a service token (protected)
  ```json
  {
    "token": "your-service-token"
  }
  ```

- `POST /api/service-auth/revoke` - Revoke a service token (protected)
  ```json
  {
    "token": "your-service-token"
  }
  ```

#### Service Account Management (Admin only)
- `GET /api/service-accounts` - List all service accounts
- `POST /api/service-accounts` - Create a new service account
- `GET /api/service-accounts/:id` - Get service account details
- `PUT /api/service-accounts/:id` - Update a service account
- `DELETE /api/service-accounts/:id` - Delete a service account
- `POST /api/service-accounts/:id/regenerate-secret` - Generate a new client secret

### Service Scopes
Services can have the following scopes:
- `[service-name]:read` - Read access to service resources
- `[service-name]:write` - Write access to service resources
- `[service-name]:admin` - Administrative access to service resources

The API Gateway has access to all scopes to facilitate proxying requests between services. 
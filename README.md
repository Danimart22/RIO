# RIO — Coworking Reservation & Attendance System

RIO is a full-stack web application designed to manage workspace reservations, employee attendance, users, and office operations in a coworking environment.

The system provides role-based access control, workspace reservation management, attendance tracking through an external ID-card scanning system, user administration, reporting, email notifications, and automated event processing.

The application is structured as separate frontend, backend, and automation services and is designed to support containerized deployment on AWS EC2.

---

## Overview

RIO was designed to centralize the management of coworking office spaces and employee attendance.

The platform allows employees to reserve workspaces, while authorized users can manage reservations, users, attendance records, and office information according to their assigned roles.

Attendance can also be registered through an external office ID-card scanning system. The `automatizacion_eventos` service processes these events and synchronizes them with the RIO database.

### Main capabilities

* Workspace reservation and availability management
* Reservation conflict prevention
* Employee attendance tracking
* Integration with an external ID-card scanning system
* User authentication and authorization
* Role-based access control
* User and profile management
* Administrative management views
* Visitor and replacement-user management
* Attendance and reservation reporting
* Email notifications through AWS SES
* AWS IAM integration
* PostgreSQL database
* Environment-based configuration
* Docker support
* AWS EC2 deployment

---

# Architecture

The application is divided into three main services:

```text
                           ┌─────────────────────────┐
                           │        React UI          │
                           │ controller-assistent-   │
                           │       frontend           │
                           └────────────┬────────────┘
                                        │
                                        │ REST API
                                        ▼
                           ┌─────────────────────────┐
                           │      Node.js API         │
                           │ controller-assistent-   │
                           │        backend           │
                           └────────────┬────────────┘
                                        │
                                        │
                                        ▼
                           ┌─────────────────────────┐
                           │       PostgreSQL         │
                           │         Database         │
                           └────────────▲────────────┘
                                        │
                                        │
                           ┌────────────┴────────────┐
                           │   automatizacion_eventos │
                           │  Attendance Integration  │
                           └────────────▲────────────┘
                                        │
                                        │
                           ┌────────────┴────────────┐
                           │ External ID-card Scanner │
                           │   / Attendance System    │
                           └─────────────────────────┘
```

The main application follows an **MVC architecture**, while the `automatizacion_eventos` service follows a **Hexagonal Architecture** to isolate its core logic from external systems and infrastructure.

---

# Technology Stack

## Frontend

* React
* JavaScript
* REST API integration
* Token-based authentication
* Docker

## Backend

* Node.js
* JavaScript
* REST API
* PostgreSQL
* Token-based authentication
* Role-based authorization
* AWS services
* Docker

## Automation Service

* Node.js
* JavaScript
* Hexagonal Architecture
* External attendance system integration
* PostgreSQL

## Infrastructure

* AWS EC2
* AWS SES
* AWS IAM
* Docker
* PostgreSQL

---

# Project Structure

```text
RIO/
│
├── controller-assistent-frontend/
│   └── React application
│
├── controller-assistent-backend/
│   └── Node.js REST API
│
├── automatizacion_eventos/
│   └── Attendance and event automation service
│
├── QueryPostgreSQL
│   └── Database schema and initialization script
│
└── README.md
```

---

# Core Components

## 1. Controller Assistant Frontend

The frontend is a React application responsible for the user interface and interaction with the RIO platform.

It communicates with the backend through REST APIs and provides interfaces for:

* User authentication
* Workspace reservations
* Reservation management
* Attendance information
* User profiles
* Administrative functions
* User management
* Reports

The application is designed to be containerized with Docker and deployed to AWS EC2.

### Installation

Requirements:

* Node.js
* npm

Navigate to the frontend directory:

```bash
cd controller-assistent-frontend
```

Install dependencies:

```bash
npm install
```

Configure the required environment variables.

### Run locally

```bash
npm run start
```

---

# 2. Controller Assistant Backend

The backend is a Node.js REST API responsible for the application's business logic and communication with PostgreSQL.

It acts as the main interface between the frontend and the database.

### Main responsibilities

* Authentication
* Authorization
* Role management
* User management
* Workspace reservations
* Reservation validation
* Attendance data
* Visitor management
* Database operations
* Email-related functionality
* API business rules

The backend is designed to be containerized using Docker and deployed on AWS EC2.

### Installation

Navigate to the backend directory:

```bash
cd controller-assistent-backend
```

Install dependencies:

```bash
npm install
```

Configure the required environment variables.

### Run locally

```bash
npm run start
```

---

# 3. Attendance & Event Automation

The `automatizacion_eventos` service is responsible for processing attendance events generated by an external office ID-card scanning system.

The service receives attendance information from the external system and communicates with the RIO PostgreSQL database to register employee check-ins and check-outs.

### Attendance flow

```text
Employee
   │
   ▼
ID Card Scanner
   │
   ▼
External Attendance System
   │
   ▼
automatizacion_eventos
   │
   ▼
PostgreSQL
   │
   ▼
RIO Attendance Records
```

This service uses **Hexagonal Architecture**, separating the application's core business logic from external integrations and infrastructure.

### Installation

Navigate to the service directory:

```bash
cd automatizacion_eventos
```

Install dependencies:

```bash
npm install
```

Configure the required environment variables.

### Run locally

```bash
npm run start
```

---

# Database

RIO uses **PostgreSQL** as its primary relational database.

The `QueryPostgreSQL` file contains the SQL required to create the main database structure.

The database includes entities for:

* Users
* Roles
* User-role relationships
* Visitors
* Office days
* Workspace reservations
* Replacement users
* Reported workspace issues
* Attendance-related information
* User schedules

The database uses UUID-based identifiers for several entities and foreign-key relationships to maintain data integrity.

---

# Authentication & Authorization

RIO implements authentication and role-based authorization.

Users are authenticated through the backend and receive a token that is used to access protected resources.

Access to functionality is controlled according to the user's assigned roles.

Examples of application roles include:

* Employee
* Administrator
* Security / Reception
* Human Resources
* Director
* Manager
* IT

This allows different users to access only the functionality associated with their responsibilities.

---

# AWS Integration

RIO is designed to support deployment in AWS using Docker containers.

### AWS services

#### Amazon EC2

Used as the target environment for deploying the containerized application components.

#### Amazon SES

Used for sending application-related email notifications.

#### AWS IAM

Used to manage permissions and access to AWS resources.

---

# Docker

The application components are designed to be containerized using Docker.

Containerization allows the frontend, backend, and automation services to be packaged independently and deployed consistently across environments.

A typical deployment structure can be represented as:

```text
AWS EC2
│
├── Frontend Container
│
├── Backend Container
│
└── Automation Service Container
        │
        ▼
    PostgreSQL
```

---

# Environment Configuration

The application uses environment variables for configuration and sensitive values.

Depending on the service, configuration may include:

* Database connection
* API URLs
* Authentication configuration
* AWS configuration
* AWS SES configuration
* External attendance system configuration

Create the appropriate `.env` files locally before running the services.

> **Security:** Never commit credentials, access keys, tokens, passwords, or other sensitive information to the repository.

---

# Technical Highlights

* Full-stack development with React and Node.js
* REST API development and integration
* PostgreSQL database integration
* Token-based authentication
* Role-based authorization
* MVC architecture
* Hexagonal Architecture for event automation
* Docker containerization
* AWS EC2 deployment
* AWS SES integration
* AWS IAM permissions
* External system integration
* Automated attendance processing
* Reservation validation and conflict prevention
* Environment-based application configuration

---

# My Contribution

I contributed to the development and maintenance of RIO across the frontend, backend, database, and automation components.

My work included:

* Developing and improving React frontend functionality
* Developing and maintaining Node.js REST API functionality
* Implementing user and role management
* Working with token-based authentication and authorization
* Integrating and working with PostgreSQL
* Implementing reservation validation and conflict prevention
* Developing attendance-related functionality
* Working on user management and administrative views
* Implementing and improving reports
* Working with AWS SES for email functionality
* Working with Docker-based deployment
* Supporting AWS EC2 deployment
* Contributing to the migration from MongoDB to PostgreSQL
* Developing and maintaining automated attendance processes
* Debugging issues across the frontend, backend, API, and database layers

---

# Running the Project Locally

Each service can be run independently.

### Frontend

```bash
cd controller-assistent-frontend
npm install
npm run start
```

### Backend

```bash
cd controller-assistent-backend
npm install
npm run start
```

### Automation Service

```bash
cd automatizacion_eventos
npm install
npm run start
```

### Database

1. Install PostgreSQL.
2. Create a PostgreSQL database.
3. Execute the provided SQL initialization script.
4. Configure the database connection through environment variables.
5. Start the backend services.

---

# Project Status

RIO is a functional full-stack application developed as a practical software engineering project.

The project demonstrates experience working across multiple layers of a web application, including:

```text
Frontend
   ↓
REST API
   ↓
Business Logic
   ↓
Database
   ↓
External Integrations
   ↓
Cloud Infrastructure
```

The project also demonstrates experience with different architectural approaches, containerization, cloud deployment, authentication, database design, and integration with external services.
****

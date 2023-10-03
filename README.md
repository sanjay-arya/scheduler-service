# NestJS Scheduler Service

A scheduler service built with NestJS that allows you to create, update, and disable schedules with support for MySQL and MongoDB as the database backend.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Usage](#usage)
- [Configuration](#configuration)
- [Endpoints](#endpoints)
  - [Create or Update Schedule](#create-or-update-schedule)
  - [Disable Schedule](#disable-schedule)
- [Job Trigger Methods](#job-trigger-methods)
- [Dockerization](#dockerization)
  - [Option 1: Using Pre-built Docker Image](#option-1-using-pre-built-docker-image)
  - [Option 2: Building Your Own Docker Image](#option-2-building-your-own-docker-image)
- [Helm Charts](#helm-charts)

## Features

- Create or update schedules.
- Disable schedules.
- Choose between MySQL and MongoDB as the database backend.
- Execute jobs with REST and Kafka trigger methods.

## Prerequisites

Before you begin, ensure you have met the following requirements:

- Node.js and npm installed.
- MySQL or MongoDB set up based on your choice.

## Installation

1. Clone the repository:

   ```bash
   git clone https://github.com/sanjay-arya/scheduler-service.git
   ```

2. Navigate to the project directory:

   ```bash
   cd scheduler-service
   ```

3. Install the dependencies:

   ```bash
   npm install
   ```

## Usage

To start the NestJS scheduler service, use the following command:

```bash
npm run start
```

## Configuration

The service can be configured using environment variables in a `.env` file. Here are the available configurations:

- `DATABASE_TYPE`: Set to `mysql` or `mongodb` based on your choice of database.
- `KAFKA_BROKERS`: Specify Kafka brokers if you want to enable Kafka trigger method (optional).
- `RETRY_BASE_DELAY`: The base delay (in seconds) for retrying failed jobs (default is 30 seconds).
- `RETRY_COUNT`: The maximum number of retry attempts for failed jobs (default is 6).

### Database Configuration

#### MySQL Configuration (if using MySQL)

- `DATABASE_USER`: MySQL database user.
- `DATABASE_PASS`: MySQL database password.
- `DATABASE_HOST`: MySQL database host.
- `DATABASE_NAME`: MySQL database name.
- `DATABASE_PORT`: MySQL database port.

#### MongoDB Configuration (if using MongoDB)

- `MONGODB_URI`: MongoDB connection URI.

#### Kafka Configuration (optional, if using Kafka)

- `KAFKA_BROKERS`: Kafka broker(s) address.

#### Service Configuration

- `PORT`: Port on which the NestJS service will run (default is 3000).

Example `.env` file for MySQL:

```plaintext
DATABASE_TYPE=mysql

DATABASE_USER=root
DATABASE_PASS=root
DATABASE_HOST=localhost
DATABASE_NAME=scheduler
DATABASE_PORT=3306
```

Example `.env` file for MongoDB:

```plaintext
DATABASE_TYPE=mongodb

MONGODB_URI='mongodb://localhost/scheduler'
```

Example `.env` file with Kafka configuration:

```plaintext
KAFKA_BROKERS=1.1.1.1:9092,2.2.2.2:9092

RETRY_BASE_DELAY=30
RETRY_COUNT=6

PORT=3000
```

Make sure to customize these variables according to your specific configuration. Users can create their own .env file based on this template to configure the service for their environment.

## Endpoints

### Create or Update Schedule

**POST** `/api/schedule`

To create or update schedules, you can make a **POST** request to `/api/schedule`. This endpoint allows you to define and configure schedules for your jobs.

**Request Payload**:

```json
{
  "serviceName": "Example Service",
  "jobName": "Example Job",
  "jobDescription": "Description of the job",
  "cronTime": "* * * * * *", // Your cron expression
  "triggerMethod": "REST" // or "KAFKA"
  // Additional fields based on trigger method
}
```

- `serviceName`: A string representing the name of the service associated with the job.
- `jobName`: A string representing the name of the job.
- `jobDescription`: A string describing the job.
- `cronTime`: A string specifying the cron expression for when the job should run.
- `triggerMethod`: A string indicating the trigger method for the job. It can be either `"REST"` or `"KAFKA"`.
- `retry` (optional): A boolean indicating whether to keep retrying the job if something goes wrong during execution.
- `retryBaseDelay` (optional): The base delay (in seconds) for retrying failed jobs. The retry mechanism uses exponential backoff, with the initial retry attempt occurring after retryBaseDelay seconds and subsequent retries doubling the delay.
- `retryCount`: (optional): The maximum number of retry attempts for failed jobs.
- `isOnce` (optional): A boolean indicating if the job is a one-time job that will be disabled after a successful execution.
- `data` (optional): Additional data that will be sent as the POST request body.

**Note**: If there is an active job with the same `serviceName` and `jobName`, the existing job will be updated. If no active job is found with the provided `serviceName` and `jobName`, a new job will be created.

Depending on the chosen `triggerMethod`, you may need to provide additional fields in the request payload:

- If `triggerMethod` is `"REST"`, include:

  - `webhookUrl`: A string specifying the URL to which a POST request will be made when triggering the job.

- If `triggerMethod` is `"KAFKA"`, include:
  - `kafkaTopic`: A string specifying the Kafka topic that triggers the job.

Customize the payload based on your requirements and the chosen trigger method.

#### REST Trigger Method

```json
{
  "serviceName": "example-service",
  "jobName": "example-job",
  "jobDescription": "Description of the job",
  "cronTime": "* * * * * *",
  "triggerMethod": "REST",
  "webhookUrl": "https://example.com/webhook",
  "retry": true,
  "retryBaseDelay": 30,
  "retryCount": 6,
  "isOnce": false,
  "data": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

#### Kafka Trigger Method

```json
{
  "serviceName": "example-service",
  "jobName": "example-job",
  "jobDescription": "Description of the job",
  "cronTime": "* * * * * *",
  "triggerMethod": "KAFKA",
  "kafkaToic": "example-job-topic",
  "retry": true,
  "retryBaseDelay": 30,
  "retryCount": 6,
  "isOnce": false,
  "data": {
    "key1": "value1",
    "key2": "value2"
  }
}
```

Use this endpoint to define and configure schedules for your jobs, specifying the necessary details and trigger method based on your specific use case.

### Disable Schedule

**DELETE** `/api/schedule/:serviceName/:jobName`

Endpoint for disabling a schedule by service and job name.

## Job Trigger Methods

- **REST**: Schedules jobs triggered by HTTP requests.
- **KAFKA**: Schedules jobs triggered by Kafka messages.

## Retry Mechanism:

- When a job with retry enabled fails during execution, the scheduler service will automatically schedule a retry attempt.
- The retry mechanism follows exponential backoff, where each retry attempt increases the delay exponentially. The delay between retries is calculated based on the formula: `retryBaseDelay * Math.pow(2, currentRetryCount)`, where `retryBaseDelay` is the base delay specified in seconds, and `currentRetryCount` is the current retry attempt.
- If a normal job is scheduled to run before the next retry attempt (e.g., a job with a shorter `cronTime`), and it successfully completes, the retry attempt is canceled.
- However, if the normal job fails, the current retry attempt is skipped, and the next retry attempt with its appropriate delay is scheduled.
- The maximum number of retry attempts is determined by the `retryCount` value. If the maximum number of retries is reached and the job still fails, it will be marked as unsuccessful.
- You can customize the `retryBaseDelay` and `retryCount` values to fine-tune the retry behavior according to your needs.

## Dockerization

You have two options for running the NestJS Scheduler Service with Docker: using the pre-built Docker image from Docker Hub or building your own image.

### Option 1: Using Pre-built Docker Image

You can use the pre-built Docker image available on Docker Hub. Pull the image using the following command:

```bash
docker pull sanjayarya/scheduler-service:1.0.0
```

Replace `1.0.0` with the desired version tag.

Now, run the Docker container with the following command:

```bash
docker run -d -p 3000:3000 \
  -e DATABASE_TYPE=mysql \
  -e DATABASE_USER=root \
  -e DATABASE_PASS=root \
  -e DATABASE_HOST=localhost \
  -e DATABASE_NAME=scheduler \
  -e DATABASE_PORT=3306 \
  -e KAFKA_BROKERS=1.1.1.1:9092,2.2.2.2:9092 \
  -e RETRY_BASE_DELAY=30 \
  -e RETRY_COUNT=6 \
  -e PORT=3000 \
  sanjayarya/scheduler-service:1.0.0
```

Make sure to customize the environment variables according to your specific configuration. The -p flag maps port 3000 in the container to port 3000 on your host, but you can adjust the ports as needed.

By setting the environment variables with the -e flag, you ensure that your NestJS Scheduler Service runs with the correct configuration within the Docker container.

### Option 2: Building Your Own Docker Image

To build your own Docker image, use the provided Dockerfile. Build the Docker image using the following command:

```bash
docker build -t scheduler-service .
```

Then, run the container:

```bash
docker run -d -p 3000:3000 \
  -e DATABASE_TYPE=mysql \
  -e DATABASE_USER=root \
  -e DATABASE_PASS=root \
  -e DATABASE_HOST=localhost \
  -e DATABASE_NAME=scheduler \
  -e DATABASE_PORT=3306 \
  -e KAFKA_BROKERS=1.1.1.1:9092,2.2.2.2:9092 \
  -e RETRY_BASE_DELAY=30 \
  -e RETRY_COUNT=6 \
  -e PORT=3000 \
  scheduler-service
```

## Helm Charts

If you want to deploy the NestJS Scheduler Service on Kubernetes, you can use Helm charts. Helm charts provide an easy way to package, configure, and deploy applications to Kubernetes clusters. You can find Helm charts for this project in the `helm-charts` directory.

1. Install Helm if you haven't already: [Helm Installation Guide](https://helm.sh/docs/intro/install/)

2. Deploy the application using Helm, providing your own values file (e.g., `values.yaml`) to configure the deployment. Replace `your-values.yaml` with the path to your custom values file:

   ```bash
   helm install scheduler-service -f your-values.yaml ./helm-charts

   ```

3. To uninstall the application, use:
   ```bash
   helm uninstall scheduler-service
   ```

Make sure to customize the Helm charts and values according to your deployment requirements.

Example values.yaml file (customize as needed):

```yaml
image:
  repository: sanjayarya/scheduler-service
  pullPolicy: Always
  tag: 1.0.0

config: |-
# Environment Variables
  DATABASE_TYPE=mysql
  DATABASE_USER=
  DATABASE_PASS=
  DATABASE_HOST=
  DATABASE_NAME=
  DATABASE_PORT=

  MONGODB_URI=

  KAFKA_BROKERS=

  # Retry Configuration
  RETRY_BASE_DELAY=30
  RETRY_COUNT=6

  # Port Configuration
  PORT=3000

# Note: If you change the PORT value, remember to update it in the following places as well:
# - service/ports/externalPort
# - service/ports/internalPort
# - startupProbe/httpGet/port
# - readinessProbe/httpGet/port
# - livenessProbe/httpGet/port
```

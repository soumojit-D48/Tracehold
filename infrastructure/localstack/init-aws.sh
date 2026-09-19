#!/bin/sh
set -eu

awslocal sqs create-queue --queue-name tracehold-events >/dev/null
awslocal sqs get-queue-url --queue-name tracehold-events

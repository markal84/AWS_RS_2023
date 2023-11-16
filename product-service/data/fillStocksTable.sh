#!/bin/bash

aws dynamodb put-item --table-name stocks --item '{
    "product_id": { "S": "simulateduuid1" },
    "count": { "N": "3" }
}'

aws dynamodb put-item --table-name stocks --item '{
    "product_id": { "S": "simulateduuid2" },
    "count": { "N": "2" }
}'

aws dynamodb put-item --table-name stocks --item '{
    "product_id": { "S": "simulateduuid3" },
    "count": { "N": "8" }
}'
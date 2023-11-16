#!/bin/bash

aws dynamodb put-item \
    --table-name products \
    --item \
    '{
        "id": { "S": "simulateduuid1" },
        "title": { "S": "ProductOneDynamoDB" },
        "description": { "S": "Short Product Description1" },
        "price": { "N": "24" }
    }'

aws dynamodb put-item \
    --table-name products \
    --item \
    '{
        "id": { "S": "simulateduuid2" },
        "title": { "S": "ProductTwoDynamoDB" },
        "description": { "S": "Short Product Description2" },
        "price": { "N": "36" }
    }'

aws dynamodb put-item \
    --table-name products \
    --item \
    '{
        "id": { "S": "simulateduuid3" },
        "title": { "S": "ProductThreeDynamoDB" },
        "description": { "S": "Short Product Description3" },
        "price": { "N": "12" }
    }'
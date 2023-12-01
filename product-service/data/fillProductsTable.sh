#!/bin/bash

aws dynamodb put-item \
    --table-name products \
    --item \
    '{
        "id": { "S": "b908f0d4-0ca4-4c67-93a4-74d42fc0c0e4" },
        "title": { "S": "ProductOneDynamoDB" },
        "description": { "S": "Short Product Description1" },
        "price": { "N": "24" }
    }'

aws dynamodb put-item \
    --table-name products \
    --item \
    '{
        "id": { "S": "1f0987cc-0a1a-4043-9744-a8863b806e4d" },
        "title": { "S": "ProductTwoDynamoDB" },
        "description": { "S": "Short Product Description2" },
        "price": { "N": "36" }
    }'

aws dynamodb put-item \
    --table-name products \
    --item \
    '{
        "id": { "S": "eacdf2c8-09d6-45e0-8968-48f499f979c8" },
        "title": { "S": "ProductThreeDynamoDB" },
        "description": { "S": "Short Product Description3" },
        "price": { "N": "12" }
    }'
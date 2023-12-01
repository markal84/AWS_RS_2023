#!/bin/bash

aws dynamodb put-item --table-name stocks --item '{
    "product_id": { "S": "b908f0d4-0ca4-4c67-93a4-74d42fc0c0e4" },
    "count": { "N": "3" }
}'

aws dynamodb put-item --table-name stocks --item '{
    "product_id": { "S": "1f0987cc-0a1a-4043-9744-a8863b806e4d" },
    "count": { "N": "2" }
}'

aws dynamodb put-item --table-name stocks --item '{
    "product_id": { "S": "eacdf2c8-09d6-45e0-8968-48f499f979c8" },
    "count": { "N": "8" }
}'
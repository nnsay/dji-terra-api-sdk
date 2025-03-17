#! /bin/bash

# 1. package
rm -rf dist
yarn build
yarn pack

# 2. build
tag=$(jq -r '.version' package.json)
tar zxf nnsay-dji-terra-api-sdk-v"$tag".tgz

# 3. publish
cd package
npm publish --access public

# 4. clean
cd ..
rm -rf *.tgz package

#! /bin/bash
cd /server/dsek-web 

# Remove everything but the node_modules folder, .env is also excluded by default
shopt -s extglob
rm -r !(node_modules|build.zip) 

unzip build.zip -d .
pnpm i --ignore-scripts --prod=false
pnpm generate
pnpm prisma migrate deploy

pm2 reload web
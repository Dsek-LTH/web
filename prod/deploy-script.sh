#! /bin/bash
cd /var/www

# Remove everything but the node_modules folder, .env is also excluded by default
shopt -s extglob
rm -r !(node_modules|build.zip) 

unzip build.zip -d . && rm build.zip
pnpm i --ignore-scripts --prod=false
pnpm generate
pnpm prisma migrate deploy

pm2 reload --update-env prod/ecosystem.config.cjs
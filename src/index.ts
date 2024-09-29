if (process.env.MODEL === 'QUEUES') {
  import('./queue')
} else if (process.env.MODEL === 'IMPORT') {
  import('./importer')
} else {
  import('./server')
}
// sudo sh -c "truncate -s 0 /var/lib/docker/containers/*/*-json.log"

// CREATE USER postgres WITH PASSWORD 'postgres';
// GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;
// GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO postgres;
// ALTER USER postgres WITH SUPERUSER;

// ALTER TABLE "user_menu" RENAME COLUMN "openDate" TO "openingDate";
// ALTER TABLE "user_menu" RENAME COLUMN "closeDate" TO "closingDate";
// ALTER TABLE "user_menu" ADD COLUMN "checkingDate" TIMESTAMPTZ NOT NULL DEFAULT NOW();
// ALTER TABLE "user_menu" ADD COLUMN "completionDate" TIMESTAMPTZ NOT NULL DEFAULT NOW();

// ALTER TABLE "menu" RENAME COLUMN "openDate" TO "openingDate";
// ALTER TABLE "menu" RENAME COLUMN "closeDate" TO "closingDate";
// ALTER TABLE "menu" ADD COLUMN "checkingDate" TIMESTAMPTZ NOT NULL DEFAULT NOW();
// ALTER TABLE "menu" ADD COLUMN "completionDate" TIMESTAMPTZ NOT NULL DEFAULT NOW();

// UPDATE "menu" SET "openingDate" = "openingDate" - INTERVAL '2 HOURS';

// UPDATE "menu" SET "closingDate" = "closingDate" - INTERVAL '2 HOURS';

// UPDATE "menu" SET "published" = TRUE, "isComplete" = TRUE, "isOpened" = TRUE, "isChecked" = TRUE, "isBilled" = TRUE, "isClosed" = TRUE, "checkingDate" = "closingDate" - INTERVAL '2 DAYS', "billingDate" = "closingDate", "completionDate" = "closingDate";

// UPDATE "menu" SET  "isComplete" = FALSE, "isOpened" = FALSE, "isChecked" = FALSE, "isBilled" = FALSE, "isClosed" = FALSE, "published" = FALSE WHERE "closingDate" > NOW();

// SELECT COU(1), "menuId", "status" FROM "user_menu" GROUP BY "menuId", "status";

// docker -D run -d \
//   --restart=always \
//   --net=uat-network \
//   --name=postgres \
//   --hostname=postgres \
//   --env POSTGRES_DB=ucook \
//   --env POSTGRES_PASSWORD=ucook \
//   --env POSTGRES_USER=ucook \
//   -p 5432:5432 \
//   mdillon/postgis:11-alpine

// docker run \
//    --detach \
//    --name postgres \
//    --publish 5432:5432 \
//    --env POSTGRES_DB=ucook \
//    --env POSTGRES_PASSWORD=ucook \
//    --env POSTGRES_USER=ucook \
//    mdillon/postgis:11-alpine

// docker -D run -d \
//   --restart=always \
//   --net=uat-network \
//   --name=redis \
//   --hostname=redis \
//   -p 6379:6379 \
//   redis:latest

// docker run --restart=always -d -p 6970:6970 --name broker --hostname broker 'oresoftware/live-mutex-broker:0.2.24'

//  docker run -d -p 80:80 -p 443:443 \
//   --restart=always \
//   --net=uat-network \
//   --name=nginx \
//   -v /srv/nginx-proxy/conf.d:/etc/nginx/conf.d \
//   -v /srv/nginx-proxy/passwords:/etc/nginx/htpasswd \
//   -v /srv/nginx-proxy/vhosts:/etc/nginx/vhost.d \
//   -v /srv/nginx-proxy/www:/usr/share/nginx/html \
//   -v /srv/nginx-proxy/certs:/etc/nginx/certs \
//   -v /var/run/docker.sock:/tmp/docker.sock:ro \
//   jwilder/nginx-proxy

// docker run -d \
//   --restart=always \
//   --net=uat-network \
//   --name=letsencrypt \
//   -v /srv/nginx-proxy/conf.d:/etc/nginx/conf.d \
//   -v /srv/nginx-proxy/passwords:/etc/nginx/htpasswd \
//   -v /srv/nginx-proxy/vhosts:/etc/nginx/vhost.d \
//   -v /srv/nginx-proxy/www:/usr/share/nginx/html \
//   -v /srv/nginx-proxy/certs:/etc/nginx/certs \
//   -v /var/run/docker.sock:/var/run/docker.sock:ro \
//   --env NGINX_PROXY_CONTAINER=nginx-proxy \
//   jrcs/letsencrypt-nginx-proxy-companion:2.1.0

// backup db
// te raform dde
// docker system prune --volumes -a
// teraform apply
// restore db

// sudo add-apt-repository ppa:malteworld/ppa
// sudo apt update
// sudo apt install pdftk

// 172.16.60.11 => api/allsorts
// 172.16.60.12 => redis/postgres master
// 172.16.60.13 => queue / postgres slave

//  docker run --restart=always -d -p 6971:6970 --name user-broker --hostname user-broker --network staging 'oresoftware/live-mutex-broker:0.2.24'
//  docker run --restart=always -d -p 6972:6970 --name cart-broker --hostname cart-broker --network staging 'oresoftware/live-mutex-broker:0.2.24'
//  docker run --restart=always -d -p 6973:6970 --name menu-broker --hostname menu-broker --network staging 'oresoftware/live-mutex-broker:0.2.24'
//  docker run --restart=always -d -p 6974:6970 --name stock-broker --hostname stock-broker --network staging 'oresoftware/live-mutex-broker:0.2.24'

// docker run --restart=always -d  -p 1433:1433 -name mssql --hostname mssql -e 'ACCEPT_EULA=Y' -e 'SA_PASSWORD=Uc00kT3ch' -d mcr.microsoft.com/mssql/server:2017-latest

// /opt/mssql-tools/bin/sqlcmd -S localhost -U SA -Q "RESTORE DATABASE UcookBackendAzure FROM DISK = N'/UcookBackendAzure.bak' WITH MOVE 'UcookBackendAzure' TO '/var/opt/mssql/data/UcookBackendAzure.mdf', MOVE 'UcookBackendAzure_Log' TO '/var/opt/mssql/data/UcookBackendAzure_log.ldf', FILE = 1, NOUNLOAD, REPLACE, NORECOVERY, STATS = 5"

// docker run --restart=always -d -p 6970:6970 --name broker-c --hostname broker-c --network uat-network 'oresoftware/live-mutex-broker:0.2.24'
// docker run --restart=always -d -p 6971:6971 --name broker-d --hostname broker-d --network uat-network 'oresoftware/live-mutex-broker:0.2.24'

// Git Change
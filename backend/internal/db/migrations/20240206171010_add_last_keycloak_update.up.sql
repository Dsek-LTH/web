-- CreateTable
CREATE TABLE "last_keycloak_update" (
    "id" SERIAL NOT NULL,
    "time" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "last_keycloak_update_pkey" PRIMARY KEY ("id")
);

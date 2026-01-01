-- AlterTable
ALTER TABLE "projects" ALTER COLUMN "isPublished" DROP NOT NULL,
ALTER COLUMN "isPublished" SET DEFAULT false;

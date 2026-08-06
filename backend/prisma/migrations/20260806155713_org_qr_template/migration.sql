-- AlterTable
ALTER TABLE "organizations" ADD COLUMN     "qr_template_image_url" TEXT,
ADD COLUMN     "qr_template_size" INTEGER,
ADD COLUMN     "qr_template_x" INTEGER,
ADD COLUMN     "qr_template_y" INTEGER;

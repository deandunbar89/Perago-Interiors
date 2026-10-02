-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "referralDetails" TEXT,
ADD COLUMN     "referrerContact" TEXT,
ADD COLUMN     "referrerName" TEXT;

-- AlterTable
ALTER TABLE "Subtask" ADD COLUMN     "assigneeId" TEXT;

-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "assigneeId" TEXT;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Subtask" ADD CONSTRAINT "Subtask_assigneeId_fkey" FOREIGN KEY ("assigneeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

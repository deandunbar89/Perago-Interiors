-- CreateTable
CREATE TABLE "_TaskWatchers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_TaskWatchers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateTable
CREATE TABLE "_SubtaskWatchers" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,

    CONSTRAINT "_SubtaskWatchers_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_TaskWatchers_B_index" ON "_TaskWatchers"("B");

-- CreateIndex
CREATE INDEX "_SubtaskWatchers_B_index" ON "_SubtaskWatchers"("B");

-- AddForeignKey
ALTER TABLE "_TaskWatchers" ADD CONSTRAINT "_TaskWatchers_A_fkey" FOREIGN KEY ("A") REFERENCES "Task"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_TaskWatchers" ADD CONSTRAINT "_TaskWatchers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubtaskWatchers" ADD CONSTRAINT "_SubtaskWatchers_A_fkey" FOREIGN KEY ("A") REFERENCES "Subtask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_SubtaskWatchers" ADD CONSTRAINT "_SubtaskWatchers_B_fkey" FOREIGN KEY ("B") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

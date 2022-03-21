-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Question" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "question" TEXT NOT NULL,
    "answer" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "isAnswered" BOOLEAN NOT NULL DEFAULT false,
    "askerId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    CONSTRAINT "Question_askerId_fkey" FOREIGN KEY ("askerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Question_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Question" ("answer", "askerId", "createdAt", "id", "isAnswered", "question", "userId") SELECT "answer", "askerId", "createdAt", "id", "isAnswered", "question", "userId" FROM "Question";
DROP TABLE "Question";
ALTER TABLE "new_Question" RENAME TO "Question";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;

import fs from "fs";
import path from "path";

/**
 * Logs OAuth data for users logging in via Google who do not yet exist in the database.
 * Writes details to c:\Users\InfoBulles\Desktop\candyEco\candy_client\logs\authData.txt
 */
export function logAuthData(data: any) {
  try {
    const dirPath = path.join(process.cwd(), "logs");
    if (!fs.existsSync(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
    const filePath = path.join(dirPath, "authData.txt");
    const logContent = `Timestamp: ${new Date().toISOString()}\nUser Info: ${JSON.stringify(data, null, 2)}\n------------------------------------------------\n`;
    fs.appendFileSync(filePath, logContent, "utf8");
  } catch (error) {
    console.error("Failed to write auth data to logs:", error);
  }
}

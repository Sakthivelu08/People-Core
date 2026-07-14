import mysql from 'mysql2/promise';

const host = '127.0.0.1';
const port = 3306;
const user = 'root';
const passwords = ['', 'root', 'admin', 'password', 'mysql', '1234', '123456', 'Pass@word1', 'Pass@123', 'admin123', 'root123', 'mysql123', 'password123', 'welcome123', 'welcome'];

async function test() {
  for (const password of passwords) {
    try {
      console.log(`Testing password: "${password}"...`);
      const conn = await mysql.createConnection({
        host,
        port,
        user,
        password
      });
      console.log(`SUCCESS! Password is: "${password}"`);
      await conn.end();
      return;
    } catch (err: any) {
      console.log(`Failed for "${password}":`, err.message);
    }
  }
  console.log('None of the common passwords worked.');
}

test();

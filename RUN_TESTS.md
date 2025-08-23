สรุปการรัน unit tests สำหรับโปรเจคนี้

1. เปิด Command Prompt / PowerShell / Terminal ที่โฟลเดอร์ root ของรีโป:
   cd d:\MSU\GitHub\MSU.MALog

2. ตรวจสอบ .NET SDK:
   dotnet --version
   (ต้องเป็นเวอร์ชันที่โปรเจคใช้)

3. คืนค่าพัคเกจ:
   dotnet restore

4. รันทุกเทสต์ (จะค้นหาและรันทุกโปรเจคที่เป็น test project):
   dotnet test

5. รันเทสต์ของโปรเจคใดโปรเจคหนึ่ง โดยระบุไฟล์ .csproj:
   dotnet test .\MSUMALog.Server.Tests\MSUMALog.Server.Tests.csproj

6. รันเทสต์แบบเจาะจงเมธอด:
   - ตามชื่อเต็ม (แนะนำถ้ามีชื่อซ้ำ):
     dotnet test --filter "FullyQualifiedName~IncidentReportsControllerTests.GetAll_ReturnsUnauthorized_IfUserNotAuthenticated"
   - หรือโดยชื่อเมธอด:
     dotnet test --filter "Name=GetAll_ReturnsUnauthorized_IfUserNotAuthenticated"

7. เข้าถึงผลลัพธ์และรายงาน:
   - คำสั่ง dotnet test จะแสดงผลผ่าน console
   - หากต้องการรายงานเพิ่มเติม ให้ใช้ตัวเลือก --logger (เช่น trx หรือ html ผ่านตัวเสริม)

8. ใน IDE:
   - Visual Studio: เปิดโซลูชัน → Test Explorer → Run All / Run Selected
   - VS Code: ติดตั้ง .NET Test Explorer หรือใช้เทอร์มินัลกับคำสั่ง dotnet test

ข้อควรระวัง

- หากเทสต์ขึ้นกับฐานข้อมูล ให้สังเกตการตั้งค่า InMemoryDatabase (tests ใน repo นี้ใช้ UseInMemoryDatabase จึงรันได้ในเครื่องโดยไม่ต้อง config DB ภายนอก)
- หากพบปัญหา ให้รัน dotnet restore อีกครั้ง และเช็กเวอร์ชัน SDK ให้ตรงกับโปรเจค

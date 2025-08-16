using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MSUMALog.Server.Migrations
{
    /// <inheritdoc />
    public partial class UpdateIncidentReportFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CreatedBy",
                table: "IncidentReports");

            migrationBuilder.AlterColumn<string>(
                name: "PasswordHash",
                table: "Users",
                type: "nvarchar(256)",
                maxLength: 256,
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(max)",
                oldNullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CreatedUserId",
                table: "IncidentReports",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UpdatedUserId",
                table: "IncidentReports",
                type: "int",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_IncidentReports_CreatedUserId",
                table: "IncidentReports",
                column: "CreatedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_IncidentReports_UpdatedUserId",
                table: "IncidentReports",
                column: "UpdatedUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_IncidentReports_Users_CreatedUserId",
                table: "IncidentReports",
                column: "CreatedUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_IncidentReports_Users_UpdatedUserId",
                table: "IncidentReports",
                column: "UpdatedUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_IncidentReports_Users_CreatedUserId",
                table: "IncidentReports");

            migrationBuilder.DropForeignKey(
                name: "FK_IncidentReports_Users_UpdatedUserId",
                table: "IncidentReports");

            migrationBuilder.DropIndex(
                name: "IX_IncidentReports_CreatedUserId",
                table: "IncidentReports");

            migrationBuilder.DropIndex(
                name: "IX_IncidentReports_UpdatedUserId",
                table: "IncidentReports");

            migrationBuilder.DropColumn(
                name: "CreatedUserId",
                table: "IncidentReports");

            migrationBuilder.DropColumn(
                name: "UpdatedUserId",
                table: "IncidentReports");

            migrationBuilder.AlterColumn<string>(
                name: "PasswordHash",
                table: "Users",
                type: "nvarchar(max)",
                nullable: true,
                oldClrType: typeof(string),
                oldType: "nvarchar(256)",
                oldMaxLength: 256,
                oldNullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CreatedBy",
                table: "IncidentReports",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");
        }
    }
}

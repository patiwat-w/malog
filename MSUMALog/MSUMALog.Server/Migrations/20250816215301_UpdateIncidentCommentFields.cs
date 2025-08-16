using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MSUMALog.Server.Migrations
{
    /// <inheritdoc />
    public partial class UpdateIncidentCommentFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Author",
                table: "IncidentComments");

            migrationBuilder.AddColumn<int>(
                name: "AuthorUserId",
                table: "IncidentComments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "CreatedUserId",
                table: "IncidentComments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "UpdatedUserId",
                table: "IncidentComments",
                type: "int",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedUtc",
                table: "IncidentComments",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_IncidentComments_AuthorUserId",
                table: "IncidentComments",
                column: "AuthorUserId");

            migrationBuilder.CreateIndex(
                name: "IX_IncidentComments_CreatedUserId",
                table: "IncidentComments",
                column: "CreatedUserId");

            migrationBuilder.CreateIndex(
                name: "IX_IncidentComments_UpdatedUserId",
                table: "IncidentComments",
                column: "UpdatedUserId");

            migrationBuilder.AddForeignKey(
                name: "FK_IncidentComments_Users_AuthorUserId",
                table: "IncidentComments",
                column: "AuthorUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_IncidentComments_Users_CreatedUserId",
                table: "IncidentComments",
                column: "CreatedUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);

            migrationBuilder.AddForeignKey(
                name: "FK_IncidentComments_Users_UpdatedUserId",
                table: "IncidentComments",
                column: "UpdatedUserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_IncidentComments_Users_AuthorUserId",
                table: "IncidentComments");

            migrationBuilder.DropForeignKey(
                name: "FK_IncidentComments_Users_CreatedUserId",
                table: "IncidentComments");

            migrationBuilder.DropForeignKey(
                name: "FK_IncidentComments_Users_UpdatedUserId",
                table: "IncidentComments");

            migrationBuilder.DropIndex(
                name: "IX_IncidentComments_AuthorUserId",
                table: "IncidentComments");

            migrationBuilder.DropIndex(
                name: "IX_IncidentComments_CreatedUserId",
                table: "IncidentComments");

            migrationBuilder.DropIndex(
                name: "IX_IncidentComments_UpdatedUserId",
                table: "IncidentComments");

            migrationBuilder.DropColumn(
                name: "AuthorUserId",
                table: "IncidentComments");

            migrationBuilder.DropColumn(
                name: "CreatedUserId",
                table: "IncidentComments");

            migrationBuilder.DropColumn(
                name: "UpdatedUserId",
                table: "IncidentComments");

            migrationBuilder.DropColumn(
                name: "UpdatedUtc",
                table: "IncidentComments");

            migrationBuilder.AddColumn<string>(
                name: "Author",
                table: "IncidentComments",
                type: "nvarchar(200)",
                maxLength: 200,
                nullable: false,
                defaultValue: "");
        }
    }
}

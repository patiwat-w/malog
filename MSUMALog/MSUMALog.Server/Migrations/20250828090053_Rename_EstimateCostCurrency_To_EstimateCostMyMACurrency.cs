using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MSUMALog.Server.Migrations
{
    /// <inheritdoc />
    public partial class Rename_EstimateCostCurrency_To_EstimateCostMyMACurrency : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<decimal>(
                name: "EstimateCostMyMA",
                table: "IncidentReports",
                type: "decimal(18,2)",
                nullable: false,
                defaultValue: 0m);

            migrationBuilder.AddColumn<string>(
                name: "EstimateCostMyMACurrency",
                table: "IncidentReports",
                type: "nvarchar(3)",
                maxLength: 3,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "EstimateCostMyMA",
                table: "IncidentReports");

            migrationBuilder.DropColumn(
                name: "EstimateCostMyMACurrency",
                table: "IncidentReports");
        }
    }
}

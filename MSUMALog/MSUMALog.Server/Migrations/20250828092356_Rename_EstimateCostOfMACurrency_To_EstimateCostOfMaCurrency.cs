using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MSUMALog.Server.Migrations
{
    /// <inheritdoc />
    public partial class Rename_EstimateCostOfMACurrency_To_EstimateCostOfMaCurrency : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "EstimateCostMyMACurrency",
                table: "IncidentReports",
                newName: "EstimateCostOfMaCurrency");

            migrationBuilder.RenameColumn(
                name: "EstimateCostMyMA",
                table: "IncidentReports",
                newName: "EstimateCostOfMa");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "EstimateCostOfMaCurrency",
                table: "IncidentReports",
                newName: "EstimateCostMyMACurrency");

            migrationBuilder.RenameColumn(
                name: "EstimateCostOfMa",
                table: "IncidentReports",
                newName: "EstimateCostMyMA");
        }
    }
}

namespace SteelFlow.API.DTOs;

public class CreateProductDto
{
    public int CategoryId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Unit { get; set; } = "кг";
    public decimal PricePerUnit { get; set; }
    public decimal StockQuantity { get; set; }
}

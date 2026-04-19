namespace SteelFlow.API.DTOs;

public class CreateClientDto
{
    public string CompanyName { get; set; } = string.Empty;
    public string? ContactPerson { get; set; }
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public decimal DiscountPercent { get; set; } = 0;
}

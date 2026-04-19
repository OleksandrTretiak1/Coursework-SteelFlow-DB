namespace SteelFlow.API.DTOs;

public class CreateOrderDto
{
    public int ClientId { get; set; }
    public int EmployeeId { get; set; }
    public List<CreateOrderItemDto> Items { get; set; } = new();
}

public class CreateOrderItemDto
{
    public int ProductId { get; set; }
    public decimal Quantity { get; set; }
}

using Microsoft.EntityFrameworkCore;
using SteelFlow.API.Data;
using SteelFlow.API.DTOs;
using SteelFlow.API.Models;
using SteelFlow.API.Services.Interfaces;

namespace SteelFlow.API.Services;

public class OrderService : IOrderService
{
    private readonly AppDbContext _context;

    public OrderService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<Order> CreateOrderAsync(CreateOrderDto dto)
    {
        var client = await _context.Clients.FindAsync(dto.ClientId)
            ?? throw new KeyNotFoundException($"Client with ID {dto.ClientId} not found.");

        var employee = await _context.Employees.FindAsync(dto.EmployeeId)
            ?? throw new KeyNotFoundException($"Employee with ID {dto.EmployeeId} not found.");

        var order = new Order
        {
            ClientId = dto.ClientId,
            EmployeeId = dto.EmployeeId,
            OrderDate = DateTime.UtcNow,
            Status = "нове"
        };

        decimal totalAmount = 0;

        foreach (var itemDto in dto.Items)
        {
            var product = await _context.Products.FindAsync(itemDto.ProductId)
                ?? throw new KeyNotFoundException($"Product with ID {itemDto.ProductId} not found.");

            if (product.StockQuantity < itemDto.Quantity)
                throw new InvalidOperationException(
                    $"Insufficient stock for product '{product.Name}'. Available: {product.StockQuantity}, requested: {itemDto.Quantity}.");

            decimal lineTotal = itemDto.Quantity * product.PricePerUnit
                                * (1 - client.DiscountPercent / 100m);

            var orderItem = new OrderItem
            {
                ProductId = itemDto.ProductId,
                Quantity = itemDto.Quantity,
                UnitPrice = product.PricePerUnit,
                DiscountPercent = client.DiscountPercent,
                LineTotal = Math.Round(lineTotal, 2)
            };

            order.OrderItems.Add(orderItem);
            totalAmount += orderItem.LineTotal;

            product.StockQuantity -= itemDto.Quantity;
        }

        order.TotalAmount = Math.Round(totalAmount, 2);

        _context.Orders.Add(order);
        await _context.SaveChangesAsync();

        return order;
    }

    public async Task UpdateOrderStatusAsync(int id, string status)
    {
        var order = await _context.Orders.Include(o => o.OrderItems).FirstOrDefaultAsync(o => o.OrderId == id);
        if (order == null) throw new KeyNotFoundException($"Order {id} not found.");

        bool isCanceling = status == "скасовано";
        bool wasCanceled = order.Status == "скасовано";

        if (isCanceling && !wasCanceled)
        {
            foreach (var item in order.OrderItems)
            {
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product != null) product.StockQuantity += item.Quantity;
            }
        }
        else if (!isCanceling && wasCanceled)
        {
            foreach (var item in order.OrderItems)
            {
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product != null)
                {
                    if (product.StockQuantity < item.Quantity)
                        throw new InvalidOperationException($"Not enough stock to uncancel order for product '{product.Name}'.");
                    product.StockQuantity -= item.Quantity;
                }
            }
        }

        order.Status = status;
        await _context.SaveChangesAsync();
    }

    public async Task DeleteOrderAsync(int id)
    {
        var order = await _context.Orders.Include(o => o.OrderItems).FirstOrDefaultAsync(o => o.OrderId == id);
        if (order == null) throw new KeyNotFoundException($"Order {id} not found.");

        if (order.Status != "скасовано")
        {
            foreach (var item in order.OrderItems)
            {
                var product = await _context.Products.FindAsync(item.ProductId);
                if (product != null) product.StockQuantity += item.Quantity;
            }
        }

        _context.Orders.Remove(order);
        await _context.SaveChangesAsync();
    }
}

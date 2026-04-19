using SteelFlow.API.DTOs;
using SteelFlow.API.Models;

namespace SteelFlow.API.Services.Interfaces;

public interface IOrderService
{
    Task<Order> CreateOrderAsync(CreateOrderDto dto);
    Task UpdateOrderStatusAsync(int id, string status);
    Task DeleteOrderAsync(int id);
}

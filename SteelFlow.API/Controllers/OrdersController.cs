using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SteelFlow.API.Data;
using SteelFlow.API.DTOs;
using SteelFlow.API.Models;
using SteelFlow.API.Services.Interfaces;

namespace SteelFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _context;
    private readonly IOrderService _orderService;

    public OrdersController(AppDbContext context, IOrderService orderService)
    {
        _context = context;
        _orderService = orderService;
    }

    [HttpGet]
    public async Task<ActionResult> GetAll()
    {
        var orders = await _context.Orders
            .Include(o => o.Client)
            .Include(o => o.Employee)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .OrderByDescending(o => o.OrderDate)
            .Select(o => new {
                o.OrderId, o.ClientId, o.EmployeeId, o.OrderDate, o.TotalAmount, o.Status,
                Client = new { o.Client.ClientId, o.Client.CompanyName, o.Client.DiscountPercent },
                Employee = new { o.Employee.EmployeeId, o.Employee.FirstName, o.Employee.LastName },
                OrderItems = o.OrderItems.Select(oi => new {
                    oi.OrderItemId, oi.ProductId, oi.Quantity, oi.UnitPrice, oi.DiscountPercent, oi.LineTotal,
                    Product = new { oi.Product.ProductId, oi.Product.Name, oi.Product.Unit }
                })
            })
            .ToListAsync();
        return Ok(orders);
    }

    [HttpGet("{id}")]
    public async Task<ActionResult> GetById(int id)
    {
        var order = await _context.Orders
            .Include(o => o.Client)
            .Include(o => o.Employee)
            .Include(o => o.OrderItems)
                .ThenInclude(oi => oi.Product)
            .Where(o => o.OrderId == id)
            .Select(o => new {
                o.OrderId, o.ClientId, o.EmployeeId, o.OrderDate, o.TotalAmount, o.Status,
                Client = new { o.Client.ClientId, o.Client.CompanyName, o.Client.DiscountPercent },
                Employee = new { o.Employee.EmployeeId, o.Employee.FirstName, o.Employee.LastName },
                OrderItems = o.OrderItems.Select(oi => new {
                    oi.OrderItemId, oi.ProductId, oi.Quantity, oi.UnitPrice, oi.DiscountPercent, oi.LineTotal,
                    Product = new { oi.Product.ProductId, oi.Product.Name, oi.Product.Unit }
                })
            })
            .FirstOrDefaultAsync();

        if (order == null) return NotFound();
        return Ok(order);
    }

    [HttpPost]
    public async Task<ActionResult> Create(CreateOrderDto dto)
    {
        try
        {
            var order = await _orderService.CreateOrderAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = order.OrderId }, new { order.OrderId, order.TotalAmount });
        }
        catch (KeyNotFoundException ex)
        {
            return NotFound(new { error = ex.Message });
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var order = await _context.Orders.FindAsync(id);
        if (order == null) return NotFound();

        _context.Orders.Remove(order);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

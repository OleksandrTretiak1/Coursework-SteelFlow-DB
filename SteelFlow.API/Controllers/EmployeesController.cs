using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SteelFlow.API.Data;
using SteelFlow.API.DTOs;
using SteelFlow.API.Models;

namespace SteelFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class EmployeesController : ControllerBase
{
    private readonly AppDbContext _context;

    public EmployeesController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Employee>>> GetAll()
    {
        return await _context.Employees.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Employee>> GetById(int id)
    {
        var employee = await _context.Employees.FindAsync(id);
        if (employee == null) return NotFound();
        return employee;
    }

    [HttpPost]
    public async Task<ActionResult<Employee>> Create(CreateEmployeeDto dto)
    {
        if (!string.IsNullOrEmpty(dto.Phone) && await _context.Employees.AnyAsync(e => e.Phone == dto.Phone))
            return Conflict(new { error = "Працівник з таким номером телефону вже існує" });

        var employee = new Employee
        {
            FirstName = dto.FirstName,
            LastName = dto.LastName,
            Position = dto.Position,
            Phone = dto.Phone
        };

        _context.Employees.Add(employee);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = employee.EmployeeId }, employee);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, CreateEmployeeDto dto)
    {
        var employee = await _context.Employees.FindAsync(id);
        if (employee == null) return NotFound();

        employee.FirstName = dto.FirstName;
        employee.LastName = dto.LastName;
        employee.Position = dto.Position;
        employee.Phone = dto.Phone;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var employee = await _context.Employees.FindAsync(id);
        if (employee == null) return NotFound();

        _context.Employees.Remove(employee);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

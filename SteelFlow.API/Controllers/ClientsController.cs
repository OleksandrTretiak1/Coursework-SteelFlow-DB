using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SteelFlow.API.Data;
using SteelFlow.API.DTOs;
using SteelFlow.API.Models;

namespace SteelFlow.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class ClientsController : ControllerBase
{
    private readonly AppDbContext _context;

    public ClientsController(AppDbContext context)
    {
        _context = context;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<Client>>> GetAll()
    {
        return await _context.Clients.ToListAsync();
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<Client>> GetById(int id)
    {
        var client = await _context.Clients.FindAsync(id);
        if (client == null) return NotFound();
        return client;
    }

    [HttpPost]
    public async Task<ActionResult<Client>> Create(CreateClientDto dto)
    {
        if (await _context.Clients.AnyAsync(c => c.CompanyName == dto.CompanyName))
            return Conflict(new { error = "Клієнт з такою назвою компанії вже існує" });
        if (!string.IsNullOrEmpty(dto.Phone) && await _context.Clients.AnyAsync(c => c.Phone == dto.Phone))
            return Conflict(new { error = "Клієнт з таким номером телефону вже існує" });
        if (!string.IsNullOrEmpty(dto.Email) && await _context.Clients.AnyAsync(c => c.Email == dto.Email))
            return Conflict(new { error = "Клієнт з такою електронною поштою вже існує" });

        var client = new Client
        {
            CompanyName = dto.CompanyName,
            ContactPerson = dto.ContactPerson,
            Phone = dto.Phone,
            Email = dto.Email,
            DiscountPercent = dto.DiscountPercent
        };

        _context.Clients.Add(client);
        await _context.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = client.ClientId }, client);
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, CreateClientDto dto)
    {
        var client = await _context.Clients.FindAsync(id);
        if (client == null) return NotFound();

        client.CompanyName = dto.CompanyName;
        client.ContactPerson = dto.ContactPerson;
        client.Phone = dto.Phone;
        client.Email = dto.Email;
        client.DiscountPercent = dto.DiscountPercent;

        await _context.SaveChangesAsync();
        return NoContent();
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var client = await _context.Clients.FindAsync(id);
        if (client == null) return NotFound();

        _context.Clients.Remove(client);
        await _context.SaveChangesAsync();
        return NoContent();
    }
}

using Microsoft.EntityFrameworkCore;
using SteelFlow.API.Models;

namespace SteelFlow.API.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Category> Categories { get; set; } = null!;
    public DbSet<Product> Products { get; set; } = null!;
    public DbSet<Employee> Employees { get; set; } = null!;
    public DbSet<Client> Clients { get; set; } = null!;
    public DbSet<Order> Orders { get; set; } = null!;
    public DbSet<OrderItem> OrderItems { get; set; } = null!;

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasIndex(c => c.Name).IsUnique();
        });

        modelBuilder.Entity<Product>(entity =>
        {
            entity.HasOne(p => p.Category)
                  .WithMany(c => c.Products)
                  .HasForeignKey(p => p.CategoryId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(p => p.CategoryId);

            entity.Property(p => p.PricePerUnit)
                  .HasPrecision(12, 2);

            entity.Property(p => p.StockQuantity)
                  .HasPrecision(12, 3);
        });

        modelBuilder.Entity<Client>(entity =>
        {
            entity.Property(c => c.DiscountPercent)
                  .HasPrecision(5, 2);
        });

        modelBuilder.Entity<Order>(entity =>
        {
            entity.HasOne(o => o.Client)
                  .WithMany(c => c.Orders)
                  .HasForeignKey(o => o.ClientId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasOne(o => o.Employee)
                  .WithMany(e => e.Orders)
                  .HasForeignKey(o => o.EmployeeId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(o => o.ClientId);
            entity.HasIndex(o => o.EmployeeId);
            entity.HasIndex(o => o.OrderDate);

            entity.Property(o => o.TotalAmount)
                  .HasPrecision(14, 2);
        });

        modelBuilder.Entity<OrderItem>(entity =>
        {
            entity.HasOne(oi => oi.Order)
                  .WithMany(o => o.OrderItems)
                  .HasForeignKey(oi => oi.OrderId)
                  .OnDelete(DeleteBehavior.Cascade);

            entity.HasOne(oi => oi.Product)
                  .WithMany(p => p.OrderItems)
                  .HasForeignKey(oi => oi.ProductId)
                  .OnDelete(DeleteBehavior.Restrict);

            entity.HasIndex(oi => oi.OrderId);
            entity.HasIndex(oi => oi.ProductId);

            entity.Property(oi => oi.Quantity)
                  .HasPrecision(12, 3);

            entity.Property(oi => oi.UnitPrice)
                  .HasPrecision(12, 2);

            entity.Property(oi => oi.DiscountPercent)
                  .HasPrecision(5, 2);

            entity.Property(oi => oi.LineTotal)
                  .HasPrecision(14, 2);
        });
    }
}

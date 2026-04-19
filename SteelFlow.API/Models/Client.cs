using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SteelFlow.API.Models;

[Table("clients")]
public class Client
{
    [Key]
    [Column("client_id")]
    public int ClientId { get; set; }

    [Required]
    [MaxLength(200)]
    [Column("company_name")]
    public string CompanyName { get; set; } = string.Empty;

    [MaxLength(200)]
    [Column("contact_person")]
    public string? ContactPerson { get; set; }

    [MaxLength(20)]
    [Column("phone")]
    public string? Phone { get; set; }

    [MaxLength(100)]
    [Column("email")]
    public string? Email { get; set; }

    [Column("discount_percent")]
    public decimal DiscountPercent { get; set; } = 0;

    public ICollection<Order> Orders { get; set; } = new List<Order>();
}

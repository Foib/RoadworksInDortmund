using Microsoft.AspNetCore.Mvc;

namespace OpenDataProxy.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class RoadworksController : ControllerBase
    {
        private readonly ILogger<RoadworksController> _logger;

        public RoadworksController(ILogger<RoadworksController> logger)
        {
            _logger = logger;
        }

        [HttpGet(Name = "GetRoadworks")]
        public async Task<IEnumerable<Roadwork>> Get()
        {
            var client = new HttpClient();

            var response = await client.GetAsync("https://opendata.dortmund.de/OpenDataConverter/download/FB66/FB66-Baustellen%20tagesaktuell.json");
            
            if (response.IsSuccessStatusCode)
            {
                var roadworks = await response.Content.ReadFromJsonAsync<List<Roadwork>>();
                return roadworks;
            }

            return new List<Roadwork>();
        }
    }
}
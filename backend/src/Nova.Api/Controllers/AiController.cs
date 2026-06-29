using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Nova.Application.Abstractions;

namespace Nova.Api.Controllers;

[ApiController]
[Route("api/v{version:apiVersion}/ai")]
[Authorize]
public sealed class AiController : ControllerBase
{
    private readonly IAiAgentRegistry _registry;

    public AiController(IAiAgentRegistry registry) => _registry = registry;

    [HttpGet("capabilities")]
    public ActionResult<IReadOnlyCollection<string>> Capabilities()
    {
        return Ok(_registry.AvailableCapabilities);
    }

    [HttpPost("execute")]
    public async Task<ActionResult<AgentResponse>> Execute([FromBody] AgentRequest request, CancellationToken ct)
    {
        try
        {
            var agent = _registry.Resolve(request.Capability);
            var response = await agent.ExecuteAsync(request, ct);
            return Ok(response);
        }
        catch (KeyNotFoundException ex)
        {
            return BadRequest(new { error = ex.Message });
        }
    }
}

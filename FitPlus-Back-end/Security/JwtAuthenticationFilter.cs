using System;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Security.Claims;
using System.Threading;
using System.Threading.Tasks;
using System.Web.Http;
using System.Web.Http.Filters;

namespace FitPulseBackend.Security
{
    /// <summary>
    /// Validates an incoming Authorization: Bearer token and installs its
    /// principal before Web API evaluates [Authorize]. Invalid bearer tokens are
    /// treated as anonymous so login/register still work with a stale saved token.
    /// </summary>
    public sealed class JwtAuthenticationFilter : IAuthenticationFilter
    {
        public bool AllowMultiple
        {
            get { return false; }
        }

        public Task AuthenticateAsync(HttpAuthenticationContext context, CancellationToken cancellationToken)
        {
            var authorization = context.ActionContext.Request.Headers.Authorization;
            if (authorization == null ||
                !string.Equals(authorization.Scheme, "Bearer", StringComparison.OrdinalIgnoreCase) ||
                string.IsNullOrWhiteSpace(authorization.Parameter))
            {
                context.Principal = new ClaimsPrincipal(new ClaimsIdentity());
                return Task.FromResult(0);
            }

            ClaimsPrincipal principal;
            if (JwtTokenService.TryValidateToken(authorization.Parameter, out principal))
            {
                context.Principal = principal;
            }
            else
            {
                context.Principal = new ClaimsPrincipal(new ClaimsIdentity());
            }

            return Task.FromResult(0);
        }

        public Task ChallengeAsync(HttpAuthenticationChallengeContext context, CancellationToken cancellationToken)
        {
            context.Result = new AddBearerChallengeResult(context.Result);
            return Task.FromResult(0);
        }

        private sealed class AddBearerChallengeResult : IHttpActionResult
        {
            private readonly IHttpActionResult _innerResult;

            public AddBearerChallengeResult(IHttpActionResult innerResult)
            {
                _innerResult = innerResult;
            }

            public async Task<HttpResponseMessage> ExecuteAsync(CancellationToken cancellationToken)
            {
                var response = await _innerResult.ExecuteAsync(cancellationToken);
                if (response.StatusCode == HttpStatusCode.Unauthorized)
                {
                    response.Headers.WwwAuthenticate.Add(new AuthenticationHeaderValue("Bearer"));
                }

                return response;
            }
        }
    }
}

using System;
using System.Globalization;
using System.Security.Cryptography;
using System.Text;

namespace FitPulseBackend.Security
{
    /// <summary>
    /// PBKDF2-SHA256 password hashing. The legacy check is intentionally limited
    /// to upgrading passwords written in plaintext by the previous backend.
    /// </summary>
    public static class PasswordHasher
    {
        private const string Format = "pbkdf2-sha256";
        private const int Iterations = 210000;
        private const int SaltSizeBytes = 16;
        private const int HashSizeBytes = 32;

        public static string Hash(string password)
        {
            if (password == null)
            {
                throw new ArgumentNullException(nameof(password));
            }

            var salt = new byte[SaltSizeBytes];
            using (var random = new RNGCryptoServiceProvider())
            {
                random.GetBytes(salt);
            }

            byte[] derivedKey;
            using (var pbkdf2 = new Rfc2898DeriveBytes(
                Encoding.UTF8.GetBytes(password), salt, Iterations, HashAlgorithmName.SHA256))
            {
                derivedKey = pbkdf2.GetBytes(HashSizeBytes);
            }

            return string.Join("$",
                Format,
                Iterations.ToString(CultureInfo.InvariantCulture),
                Convert.ToBase64String(salt),
                Convert.ToBase64String(derivedKey));
        }

        /// <summary>
        /// Verifies both the current PBKDF2 format and old plaintext rows. When
        /// a plaintext password matches, the caller should immediately re-hash it.
        /// </summary>
        public static bool Verify(string password, string storedValue, out bool needsRehash)
        {
            needsRehash = false;
            if (password == null || string.IsNullOrEmpty(storedValue))
            {
                return false;
            }

            if (!storedValue.StartsWith(Format + "$", StringComparison.Ordinal))
            {
                var matchesLegacyValue = FixedTimeEquals(
                    Encoding.UTF8.GetBytes(password),
                    Encoding.UTF8.GetBytes(storedValue));
                needsRehash = matchesLegacyValue;
                return matchesLegacyValue;
            }

            var parts = storedValue.Split('$');
            int storedIterations;
            if (parts.Length != 4 ||
                !int.TryParse(parts[1], NumberStyles.None, CultureInfo.InvariantCulture, out storedIterations) ||
                storedIterations != Iterations)
            {
                return false;
            }

            try
            {
                var salt = Convert.FromBase64String(parts[2]);
                var expectedHash = Convert.FromBase64String(parts[3]);
                if (salt.Length != SaltSizeBytes || expectedHash.Length != HashSizeBytes)
                {
                    return false;
                }

                byte[] actualHash;
                using (var pbkdf2 = new Rfc2898DeriveBytes(
                    Encoding.UTF8.GetBytes(password), salt, storedIterations, HashAlgorithmName.SHA256))
                {
                    actualHash = pbkdf2.GetBytes(HashSizeBytes);
                }

                return FixedTimeEquals(actualHash, expectedHash);
            }
            catch (FormatException)
            {
                return false;
            }
        }

        private static bool FixedTimeEquals(byte[] left, byte[] right)
        {
            var difference = left.Length ^ right.Length;
            var length = Math.Max(left.Length, right.Length);
            for (var index = 0; index < length; index++)
            {
                var leftByte = index < left.Length ? left[index] : (byte)0;
                var rightByte = index < right.Length ? right[index] : (byte)0;
                difference |= leftByte ^ rightByte;
            }

            return difference == 0;
        }
    }
}

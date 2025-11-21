FROM php:8.3-apache

# Install system dependencies
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libicu-dev \
    libzip-dev \
    libonig-dev \
    libxml2-dev \
    && docker-php-ext-install \
    intl \
    pdo_mysql \
    zip \
    opcache \
    mbstring \
    xml \
    ctype \
    iconv

# Enable Apache mod_rewrite
RUN a2enmod rewrite

# Set working directory
WORKDIR /var/www/html

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Copy composer files
COPY composer.json composer.lock ./

# Set Composer memory limit
ENV COMPOSER_MEMORY_LIMIT=-1

# Install dependencies
RUN composer install --no-dev --optimize-autoloader --no-scripts --verbose

# Copy application files
COPY . .

# Run composer scripts (cache clear, assets install, etc.)
RUN composer run-script post-install-cmd

# Configure Apache DocumentRoot to public
ENV APACHE_DOCUMENT_ROOT /var/www/html/public
RUN sed -ri -e 's!/var/www/html!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/sites-available/*.conf
RUN sed -ri -e 's!/var/www/!${APACHE_DOCUMENT_ROOT}!g' /etc/apache2/apache2.conf /etc/apache2/conf-available/*.conf

# Set permissions
RUN chown -R www-data:www-data var

# Entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["docker-entrypoint.sh"]

# Expose port
EXPOSE 80

# Start Apache
CMD ["apache2-foreground"]

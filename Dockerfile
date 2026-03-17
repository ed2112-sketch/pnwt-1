FROM daveearley/hi.events-all-in-one:latest

COPY digitalocean-start.sh /digitalocean-start.sh
RUN chmod +x /digitalocean-start.sh

COPY railway-start.sh /railway-start.sh
RUN chmod +x /railway-start.sh

CMD ["/digitalocean-start.sh"]

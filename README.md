The ajaxPager is a JQuery + Bootstrap plugin that creates a pagination
control bar, according to configuration, that will make remote requests
for data. The control then passes the response to a developer defined
method to create the output. In the example, we used the Handlebars
templating engine to create display items of each record in a returned
JSON recordset.

The ajaxPager requires two files, the script and the stylesheet. The
developer is then responsible for handling the formatting of the response
output. This initial release is a beta, and prior to any documentation.
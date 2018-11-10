clear; close all; more off;


% for mo = 1:6
% 
%     for d = 1:eomday(2016,mo)
% 
%         fname = ['seaice_conc_daily_nh_f17_2016' sprintf('%02d',mo) sprintf('%02d',d) '_v03r01.nc'];
% 
%         ncdisp(fname);

fname = 'seaice_conc_monthly_nh_f08_198709_v03r01.nc';
ncdisp(fname);

lat = ncread(fname,'latitude');
lon = ncread(fname,'longitude');
lat_JSON =  savejson('latjson',lat);
lon_JSON =  savejson('lonjson',lon);

fid = fopen('lat.json', 'w');
if fid == -1, error('Cannot create JSON file'); end
fwrite(fid, lat_JSON, 'char');
fclose(fid);

fid = fopen('long.json', 'w');
if fid == -1, error('Cannot create JSON file'); end
fwrite(fid, lon_JSON, 'char');
fclose(fid);
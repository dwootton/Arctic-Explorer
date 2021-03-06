clear; close all; more off;

% cd 'C:\Users\Delaney\Documents\Research!';

% for mo = 1:6
% 
%     for d = 1:eomday(2016,mo)
% 
%         fname = ['seaice_conc_daily_nh_f17_2016' sprintf('%02d',mo) sprintf('%02d',d) '_v03r01.nc'];
% 
%         ncdisp(fname);
all_data = []
months = ['01','02','03','04','05','06','07','08','09', '10', '11', '12'];
years = [ '1990', '1991', '1992']%, '1993', '1994', '1995', '1996', '1997', '1998', '1999', '2000', '2001', '2002', '2003', '2004', '2005', '2006', '2007', '2008', '2009', '2010', '2011', '2012', '2013', '2014', '2015', '2016', '2017'];
% '1980', '1981', '1982', '1983', '1984', '1985', '1986', '1987', '1988', '1989'
change_years = ['1992','1996','2008']
f_nums = ['08','11','13','17']

counter = 1;
data_counter = 1;
all_year = [];
d=zeros(304,448,37);
total_vals = 1;
endvals = zeros(1000,1);

for year_indx = 1:4:length(years)
    year_num = strcat(years(year_indx), years(year_indx+1), years(year_indx+2), years(year_indx+3))
    year_to_change = strcat(change_years(counter),change_years(counter+1),change_years(counter+2),change_years(counter+3))
    if year_num == year_to_change
        counter = counter + 2
    end
    
    f_num = strcat(f_nums(counter),f_nums(counter+1)) 
    
    for idx = 1:2:length(months)
        month_num = strcat(months(idx),months(idx+1));

        fname = strcat('RawData/seaice_conc_monthly_nh_f',f_num,'_', year_num, month_num, '_v03r01.nc')

        %fname = 'seaice_conc_daily_nh_f17_20170101_v03r01.nc';
        %ncdisp(fname);

        lat = ncread(fname,'latitude');
        lon = ncread(fname,'longitude');

        psi = ncread(fname,'seaice_conc_monthly_cdr');
        
        
        d(:,:,data_counter) = psi;
        psi(psi<0) = NaN;
        
        endval(total_vals) = mean(mean(psi,'omitnan'));
        total_vals = total_vals + 1;
        
        months_JSON =  savejson('psijson',psi);

        %all_data = [all_data, months_JSON];
        data_counter = data_counter + 1
    end  
end
%% Data to grab total values 

% process 
total_concentration =  savejson('psijson',endval);

fid = fopen('totalConcentration.json', 'w');
if fid == -1, error('Cannot create JSON file'); end
fwrite(fid, total_concentration, 'char');
fclose(fid);


%val = mean(psi())
%total_vals = [total_vals,mean(val(mean(psi())>0))];

%val

%%
clear structure;
[max_rows,max_cols,max_depth] = size(d);
psi_localized = [];

for row = 1:max_rows
    for col = 1:max_cols
        current_lat = lat(row,col);
        current_long = lon(row,col);
        
        current_array = zeros(1,data_counter);
        for data_point = 1:data_counter 
            current_array(data_point) = d(row,col,data_point);

        end
        if(~any(current_array))
            continue;
        end
        
            
        lat_lon_name = strcat('l',num2str(current_lat),'x', num2str(current_long));
        lat_lon_name = strrep(lat_lon_name,'.','_');
        lat_lon_name = strrep(lat_lon_name,'-','neg');

        structure.(lat_lon_name)= current_array;
    end
end


%% Process into LatLon Struct 

latlonstruct =  savejson('psijson',structure);

%% Write cursed latlon struct 
fid = fopen('latlongtester2.json', 'w');
if fid == -1, error('Cannot create JSON file'); end
fwrite(fid, latlonstruct, 'char');
fclose(fid);

%% 
%data = structure.('l37_5046xneg139_2845')
data = [0.8899999801,0.939999979,0.939999979,0.9499999788,0.3399999924,0,0,0,0,0,0.3499999922,0.7199999839,0.9099999797,0.8199999817,0.9299999792,0.9499999788,0.8099999819,0.01999999955,0,0,0,0,0.06999999844,0.7499999832,0.8999999799,0.9099999797,0.7299999837,0.7499999832,0,0.02999999933,0,0,0,0,0.04999999888,0.7699999828,0];
data2 = [0.9899999779,0.9899999779,0.9899999779,0.9899999779,0.9699999783,0.9599999785,0.3099999931,0,0,0,0.05999999866,0.8999999799,0.9999999776,0.9899999779,0.9899999779,0.9899999779,0.9799999781,0.7999999821,0.09999999776,0,0,0,0,0.8099999819,0.9699999783,0.9899999779,0.9899999779,0.9799999781,0.9899999779,0.9199999794,0.4099999908,0,0,0,0.3999999911,0.9899999779,0];
data3 = 	[0.2399999946,0.5899999868,0.5099999886,0.2499999944,0.1299999971,0,0,0,0,0,0,0.1899999958,0.3299999926,0.2399999946,0.2299999949,0.1999999955,0.1899999958,0,0,0,0,0,0,0.2599999942,0.08999999799,0.3799999915,0.489999989,0.2799999937,0.179999996,0,0,0,0,0,0,0.1899999958,0];

plot(data)
hold on;
plot(data2);
plot(data3);
legend('Location 1', 'Location 2', 'Location 3')
title('EDA of Temporal Data')
xlabel('time (Months)')
ylabel('Concentration (%)')
%%
%myjson = savejson('psijson',psi);
fid = fopen('psiMonthjson.json', 'w');
if fid == -1, error('Cannot create JSON file'); end
fwrite(fid, all_data, 'char');
fclose(fid);
% Saving to CSV 
%csvwrite('latdata.csv',lat)
%csvwrite('londata.csv',lon)
%csvwrite('psidata.csv',psi)
%csvwrite('rhodata.csv',rho)


% close all; subplot(1,2,1); imagesc(psi); subplot(1,2,2); imagesc(smooth_psi);
rho = 4*del2(smooth_psi,h);
%rho = 4*del2(psi,h);
%[FX,FY] = gradient(rho,h,h);
%quiver(lat,lon,FX,FY)

% the big map
figure;
subplot(1,2,1);
%ax = axesm('mapprojection','stereo','origin',[90 rotate2lon 0],'flatlimit',[-inf 90-end_lat]);
surfm(lat,lon,psi);
tightmap;
% colorbar;
% cmap = flipud(othercolor('PuBu9',30));
% colormap(gca,cmap);
% geoshow('landareas.shp', 'FaceColor', [0.5 0.5 0.5]);
% print('big_map','-depsc')

% zoom in
% figure;
% subplot(1,2,1);
% ax = axesm('mapprojection','stereo','origin',[80 rotate2lon 0],'flatlimit',[-inf 90-80]);
% surfm(lat,lon,psi);
% tightmap;
pos = get(gca,'position');
pos(1) = pos(1) - 0.08;
set(gca,'position',pos);
cb = colorbar;
pos = get(cb,'position');
pos(3) = pos(3)*0.3;
pos(1) = pos(1) + 0.12;
set(cb,'position',pos);
set(cb,'fontsize',16);
% cmap = flipud(othercolor('PuBu9',30));
colormap(gca,parula);
geoshow('landareas.shp', 'FaceColor', [0.5 0.5 0.5]);
title('$\psi$','interpreter','latex','fontsize',18);

subplot(1,2,2);
% ax = axesm('mapprojection','stereo','origin',[80 rotate2lon 0],'flatlimit',[-inf 90-80]);
%ax = axesm('mapprojection','stereo','origin',[90 rotate2lon 0],'flatlimit',[-inf 90-end_lat]);
surfm(lat,lon,-rho);
tightmap;
pos = get(gca,'position');
pos(1) = pos(1) - 0.08;
set(gca,'position',pos);
cb = colorbar;
pos = get(cb,'position');
pos(3) = pos(3)*0.3;
pos(1) = pos(1) + 0.12;
set(cb,'position',pos);
set(cb,'fontsize',16);
load('my_bwr.mat');
colormap(gca,my_bwr);
geoshow('landareas.shp', 'FaceColor', [0.5 0.5 0.5]);
caxis([-0.3e-3 0.3e-3]);
title('$\rho$','interpreter','latex','fontsize',18);
print('zoom_in','-depsc')

%     end
% end